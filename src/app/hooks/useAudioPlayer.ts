import { useEffect, useRef, useState } from 'react';

import type { PersistedAppState, PlaylistItem, RepeatMode } from '../../shared/types';
import { estimateBpmFromPeaks, normalizeFrequencyEnergy } from '../audio/tempo';
import {
  findFirstPlayableTrackId,
  findNextPlayableTrackId,
  findPreviousPlayableTrackId,
  findTrackIndex,
  getImportedTrackSelection,
  mergeImportedTracks,
  movePlaylistItem,
  removePlaylistItem,
} from '../state/playlist';

type BpmStatus = 'idle' | 'listening' | 'ready';

interface SelectTrackOptions {
  autoplay?: boolean;
  position?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface AudioPlayerHook {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  bpmStatus: BpmStatus;
  currentTrack: PlaylistItem | null;
  currentTrackId: string | null;
  energyLevel: number;
  estimatedBpm: number | null;
  handleAudioEnded: () => void;
  handleAudioError: () => void;
  handleAudioLoadedMetadata: () => void;
  handleAudioPause: () => void;
  handleAudioPlay: () => void;
  handleAudioTimeUpdate: () => void;
  importAudio: (mode: 'files' | 'folder') => Promise<void>;
  isMuted: boolean;
  isPlaying: boolean;
  moveTrackDown: (trackId: string) => void;
  moveTrackUp: (trackId: string) => void;
  playbackPosition: number;
  playlist: PlaylistItem[];
  removeTrack: (trackId: string) => void;
  repeatMode: RepeatMode;
  seekTo: (position: number) => void;
  selectTrack: (trackId: string, options?: SelectTrackOptions) => void;
  setMuted: (value: boolean) => void;
  setRepeatMode: (value: RepeatMode) => void;
  setVolume: (value: number) => void;
  trackDuration: number;
  togglePlayPause: () => Promise<void>;
  volume: number;
  skipNext: () => void;
  skipPrevious: () => void;
}

export function useAudioPlayer(initialSession: PersistedAppState): AudioPlayerHook {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const analyserDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const pendingAutoplayRef = useRef(initialSession.shouldResumePlayback);
  const pendingSeekRef = useRef(initialSession.playbackPosition);
  const peakTimesRef = useRef<number[]>([]);
  const lastPeakAtRef = useRef<number>(-Infinity);
  const runningAverageEnergyRef = useRef<number>(0.12);
  const bpmCacheRef = useRef<Record<string, number | null>>({});
  const playlistRef = useRef<PlaylistItem[]>(initialSession.playlist);
  const currentTrackIdRef = useRef<string | null>(
    initialSession.currentTrackId ??
      findFirstPlayableTrackId(initialSession.playlist),
  );
  const repeatModeRef = useRef<RepeatMode>(initialSession.repeatMode);
  const isPlayingRef = useRef(false);
  const [playlist, setPlaylist] = useState(initialSession.playlist);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(
    initialSession.currentTrackId ??
      findFirstPlayableTrackId(initialSession.playlist),
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(
    initialSession.playbackPosition,
  );
  const [trackDuration, setTrackDuration] = useState(0);
  const [volume, setVolumeState] = useState(initialSession.volume);
  const [isMuted, setMutedState] = useState(initialSession.isMuted);
  const [repeatMode, setRepeatModeState] = useState<RepeatMode>(
    initialSession.repeatMode,
  );
  const [estimatedBpm, setEstimatedBpm] = useState<number | null>(null);
  const [bpmStatus, setBpmStatus] = useState<BpmStatus>('idle');
  const [energyLevel, setEnergyLevel] = useState(0);
  const currentTrack =
    playlist.find((track) => track.id === currentTrackId) ?? null;

  playlistRef.current = playlist;
  currentTrackIdRef.current = currentTrackId;
  repeatModeRef.current = repeatMode;
  isPlayingRef.current = isPlaying;

  async function ensureAnalysisGraph(): Promise<void> {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (!sourceNodeRef.current) {
      sourceNodeRef.current =
        audioContextRef.current.createMediaElementSource(audio);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      sourceNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      analyserDataRef.current = new Uint8Array(
        analyserRef.current.frequencyBinCount,
      ) as Uint8Array<ArrayBuffer>;
    }
  }

  function resetTempoTracking(nextTrackId: string | null): void {
    peakTimesRef.current = [];
    lastPeakAtRef.current = -Infinity;
    runningAverageEnergyRef.current = 0.12;
    setEnergyLevel(0);

    if (!nextTrackId) {
      setEstimatedBpm(null);
      setBpmStatus('idle');
      return;
    }

    const cachedBpm = bpmCacheRef.current[nextTrackId];
    if (typeof cachedBpm === 'number') {
      setEstimatedBpm(cachedBpm);
      setBpmStatus('ready');
      return;
    }

    setEstimatedBpm(null);
    setBpmStatus('listening');
  }

  function selectTrack(trackId: string, options: SelectTrackOptions = {}): void {
    const targetTrack = playlistRef.current.find((track) => track.id === trackId);
    if (!targetTrack) {
      return;
    }

    const audio = audioRef.current;
    const position = options.position ?? 0;
    pendingSeekRef.current = position;
    pendingAutoplayRef.current = Boolean(options.autoplay);

    if (currentTrackIdRef.current === trackId && audio) {
      audio.currentTime = position;
      setPlaybackPosition(position);
      if (options.autoplay) {
        void audio.play().catch(() => {
          setIsPlaying(false);
        });
      }
      return;
    }

    setCurrentTrackId(trackId);
    setPlaybackPosition(position);
  }

  async function playCurrentTrack(): Promise<void> {
    const audio = audioRef.current;
    const fallbackTrackId =
      currentTrackIdRef.current ?? findFirstPlayableTrackId(playlistRef.current);
    const targetTrack = playlistRef.current.find(
      (track) => track.id === fallbackTrackId && !track.missing,
    );

    if (!audio || !targetTrack) {
      return;
    }

    if (currentTrackIdRef.current !== targetTrack.id) {
      selectTrack(targetTrack.id, { autoplay: true, position: 0 });
      return;
    }

    try {
      await ensureAnalysisGraph();
      await audio.play();
    } catch {
      setIsPlaying(false);
    }
  }

  async function togglePlayPause(): Promise<void> {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (isPlayingRef.current) {
      audio.pause();
      return;
    }

    await playCurrentTrack();
  }

  function skipNext(): void {
    const nextTrackId = findNextPlayableTrackId(
      playlistRef.current,
      currentTrackIdRef.current,
      'all',
    );
    if (nextTrackId) {
      selectTrack(nextTrackId, { autoplay: isPlayingRef.current, position: 0 });
    }
  }

  function skipPrevious(): void {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 4) {
      audio.currentTime = 0;
      setPlaybackPosition(0);
      return;
    }

    const previousTrackId = findPreviousPlayableTrackId(
      playlistRef.current,
      currentTrackIdRef.current,
    );
    if (previousTrackId) {
      selectTrack(previousTrackId, {
        autoplay: isPlayingRef.current,
        position: 0,
      });
    }
  }

  function moveTrackUp(trackId: string): void {
    setPlaylist((currentPlaylist) => {
      const trackIndex = findTrackIndex(currentPlaylist, trackId);
      return movePlaylistItem(currentPlaylist, trackIndex, trackIndex - 1);
    });
  }

  function moveTrackDown(trackId: string): void {
    setPlaylist((currentPlaylist) => {
      const trackIndex = findTrackIndex(currentPlaylist, trackId);
      return movePlaylistItem(currentPlaylist, trackIndex, trackIndex + 1);
    });
  }

  function removeTrack(trackId: string): void {
    const nextPlaylist = removePlaylistItem(playlistRef.current, trackId);
    setPlaylist(nextPlaylist);
    if (trackId !== currentTrackIdRef.current) {
      return;
    }

    const replacementTrackId =
      findNextPlayableTrackId(nextPlaylist, trackId, 'all') ??
      findFirstPlayableTrackId(nextPlaylist);
    pendingSeekRef.current = 0;
    pendingAutoplayRef.current = isPlayingRef.current;
    setCurrentTrackId(replacementTrackId);
  }

  async function importAudio(mode: 'files' | 'folder'): Promise<void> {
    const result = await window.lofiDefragger.importAudio({ mode });
    if (result.tracks.length === 0) {
      return;
    }

    const nextSelectedTrackId = getImportedTrackSelection(
      playlistRef.current,
      result.tracks,
      currentTrackIdRef.current,
      mode,
    );
    const merged = mergeImportedTracks(playlistRef.current, result.tracks);
    setPlaylist(merged);

    if (nextSelectedTrackId) {
      pendingSeekRef.current = 0;
      setCurrentTrackId(nextSelectedTrackId);
      return;
    }

    if (!currentTrackIdRef.current) {
      const firstPlayableTrack = findFirstPlayableTrackId(merged);
      if (firstPlayableTrack) {
        pendingSeekRef.current = 0;
        setCurrentTrackId(firstPlayableTrack);
      }
    }
  }

  function handleAudioLoadedMetadata(): void {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    setTrackDuration(duration || currentTrack?.duration || 0);

    if (pendingSeekRef.current > 0) {
      audio.currentTime = Math.min(pendingSeekRef.current, duration || pendingSeekRef.current);
      setPlaybackPosition(audio.currentTime);
      pendingSeekRef.current = 0;
    }

    if (pendingAutoplayRef.current) {
      pendingAutoplayRef.current = false;
      void playCurrentTrack();
    }
  }

  function handleAudioTimeUpdate(): void {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    setPlaybackPosition(audio.currentTime || 0);
  }

  function handleAudioPlay(): void {
    setIsPlaying(true);
  }

  function handleAudioPause(): void {
    setIsPlaying(false);
  }

  function handleAudioEnded(): void {
    if (repeatModeRef.current === 'one' && currentTrackIdRef.current) {
      selectTrack(currentTrackIdRef.current, { autoplay: true, position: 0 });
      return;
    }

    const nextTrackId = findNextPlayableTrackId(
      playlistRef.current,
      currentTrackIdRef.current,
      repeatModeRef.current,
    );
    if (nextTrackId) {
      selectTrack(nextTrackId, { autoplay: true, position: 0 });
      return;
    }

    setIsPlaying(false);
    setPlaybackPosition(0);
  }

  function handleAudioError(): void {
    const failedTrackId = currentTrackIdRef.current;
    if (!failedTrackId) {
      return;
    }

    setPlaylist((currentPlaylist) =>
      currentPlaylist.map((track) =>
        track.id === failedTrackId
          ? {
              ...track,
              missing: true,
              sourceUrl: '',
            }
          : track,
      ),
    );
    setIsPlaying(false);
  }

  function seekTo(position: number): void {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const safePosition = clamp(position, 0, Number.isFinite(audio.duration) ? audio.duration : position);
    audio.currentTime = safePosition;
    setPlaybackPosition(safePosition);
  }

  function setVolume(value: number): void {
    setVolumeState(clamp(value, 0, 1));
  }

  function setRepeatMode(value: RepeatMode): void {
    setRepeatModeState(value);
  }

  function setMuted(value: boolean): void {
    setMutedState(value);
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.volume = isMuted ? 0 : volume;
  }, [isMuted, volume]);

  useEffect(() => {
    if (!currentTrack) {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      }
      resetTempoTracking(null);
      setTrackDuration(0);
      return;
    }

    resetTempoTracking(currentTrack.id);

    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (currentTrack.missing || !currentTrack.sourceUrl) {
      audio.pause();
      setTrackDuration(currentTrack.duration ?? 0);
      return;
    }

    if (audio.dataset.trackId !== currentTrack.id) {
      audio.dataset.trackId = currentTrack.id;
      audio.src = currentTrack.sourceUrl;
      audio.load();
      setTrackDuration(currentTrack.duration ?? 0);
    }
  }, [
    currentTrack?.duration,
    currentTrack?.id,
    currentTrack?.missing,
    currentTrack?.sourceUrl,
  ]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrackIdRef.current || !currentTrack) {
      return;
    }

    if (initialSession.currentTrackId === currentTrackIdRef.current) {
      pendingSeekRef.current = initialSession.playbackPosition;
    }
  }, [currentTrack, initialSession.currentTrackId, initialSession.playbackPosition]);

  useEffect(() => {
    if (!isPlaying || !analyserRef.current || !audioRef.current) {
      setEnergyLevel(0);
      return;
    }

    let animationFrame = 0;
    let lastEmitAt = 0;

    const sample = (timestamp: number) => {
      const analyser = analyserRef.current;
      const audio = audioRef.current;
      const analysisData = analyserDataRef.current;
      if (!analyser || !audio || !analysisData) {
        return;
      }

      if (timestamp - lastEmitAt >= 80) {
        analyser.getByteFrequencyData(analysisData);
        const rawEnergy = normalizeFrequencyEnergy(analysisData);
        const smoothedEnergy =
          runningAverageEnergyRef.current * 0.82 + rawEnergy * 0.18;
        runningAverageEnergyRef.current = smoothedEnergy;
        setEnergyLevel(smoothedEnergy);

        const activeTrackId = currentTrackIdRef.current;
        if (activeTrackId && bpmCacheRef.current[activeTrackId] === undefined) {
          const threshold = Math.max(0.15, smoothedEnergy * 1.22);
          const trackTimeMs = audio.currentTime * 1000;

          if (
            rawEnergy > threshold &&
            trackTimeMs - lastPeakAtRef.current > 280
          ) {
            peakTimesRef.current = [...peakTimesRef.current.slice(-23), trackTimeMs];
            lastPeakAtRef.current = trackTimeMs;
            const bpm = estimateBpmFromPeaks(peakTimesRef.current);
            if (bpm) {
              bpmCacheRef.current[activeTrackId] = bpm;
              setEstimatedBpm(bpm);
              setBpmStatus('ready');
            }
          } else if (trackTimeMs > 18000) {
            bpmCacheRef.current[activeTrackId] = null;
            setBpmStatus('idle');
          }
        }

        lastEmitAt = timestamp;
      }

      animationFrame = window.requestAnimationFrame(sample);
    };

    animationFrame = window.requestAnimationFrame(sample);
    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        void audioContextRef.current.close();
      }
    };
  }, []);

  return {
    audioRef,
    bpmStatus,
    currentTrack,
    currentTrackId,
    energyLevel,
    estimatedBpm,
    handleAudioEnded,
    handleAudioError,
    handleAudioLoadedMetadata,
    handleAudioPause,
    handleAudioPlay,
    handleAudioTimeUpdate,
    importAudio,
    isMuted,
    isPlaying,
    moveTrackDown,
    moveTrackUp,
    playbackPosition,
    playlist,
    removeTrack,
    repeatMode,
    seekTo,
    selectTrack,
    setMuted,
    setRepeatMode,
    setVolume,
    skipNext,
    skipPrevious,
    togglePlayPause,
    trackDuration,
    volume,
  };
}
