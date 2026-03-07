import { type ReactNode, useEffect, useRef, useState } from 'react';

import { DEFAULT_ROWS_PER_PASS } from '../shared/session';
import type { PersistedAppState, SkinId } from '../shared/types';
import { HelpOverlay } from './components/HelpOverlay';
import { PlaylistPanel } from './components/PlaylistPanel';
import { PlaylistLauncherPanel } from './components/PlaylistLauncherPanel';
import { StatusPanel } from './components/StatusPanel';
import { TransportPanel } from './components/TransportPanel';
import { VisualizationBoard } from './components/VisualizationBoard';

import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useSimulation } from './hooks/useSimulation';

const DOS_WIDTH = 720;
const DOS_HEIGHT = 500;

interface DosTransform {
  offsetX: number;
  offsetY: number;
  scale: number;
}

function getDosTransform(): DosTransform {
  if (typeof window === 'undefined') {
    return { offsetX: 0, offsetY: 0, scale: 1 };
  }

  const scale = Math.min(
    window.innerWidth / DOS_WIDTH,
    window.innerHeight / DOS_HEIGHT,
  );
  return {
    offsetX: (window.innerWidth - DOS_WIDTH * scale) / 2,
    offsetY: (window.innerHeight - DOS_HEIGHT * scale) / 2,
    scale,
  };
}

function useDosTransform(): DosTransform {
  const [transform, setTransform] = useState(getDosTransform);

  useEffect(() => {
    const handleResize = () => setTransform(getDosTransform());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return transform;
}

function DosFrame({ children }: { children: ReactNode }) {
  const dosTransform = useDosTransform();

  return (
    <div className="dos-viewport">
      <div className="dos-stage">
        <div
          className="dos-canvas"
          style={{
            left: `${dosTransform.offsetX}px`,
            top: `${dosTransform.offsetY}px`,
            transform: `scale(${dosTransform.scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function normalizeManualBpm(value: number): number {
  if (!Number.isFinite(value)) {
    return 92;
  }
  return Math.min(160, Math.max(60, Math.round(value)));
}

function AppShell({
  initialFullscreen,
  initialSession,
}: {
  initialFullscreen: boolean;
  initialSession: PersistedAppState;
}) {
  const [isTestMode, setIsTestMode] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [playlistOutsideClicks, setPlaylistOutsideClicks] = useState(0);
  const [skinId, setSkinId] = useState<SkinId>(initialSession.skinId);
  const [speed, setSpeed] = useState(initialSession.speed);
  const [beatSyncEnabled, setBeatSyncEnabled] = useState(
    initialSession.beatSyncEnabled,
  );
  const [manualBpm, setManualBpm] = useState(
    normalizeManualBpm(initialSession.manualBpm ?? 92),
  );
  const [isFullscreen, setIsFullscreen] = useState(initialFullscreen);
  const helpOverlayRef = useRef<HTMLDivElement>(null);
  const playlistOverlayRef = useRef<HTMLDivElement>(null);
  const player = useAudioPlayer(initialSession);
  const effectiveBpm = beatSyncEnabled
    ? player.estimatedBpm ?? manualBpm
    : null;
  const simulation = useSimulation({
    beatSyncEnabled,
    effectiveBpm,
    energyLevel: player.energyLevel,
    isRunning: player.isPlaying || isTestMode,
    speed,
  });

  useEffect(() => {
    return window.lofiDefragger.onFullscreenChanged((value) => {
      setIsFullscreen(value);
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'F1') {
        return;
      }

      event.preventDefault();
      if (event.repeat) {
        return;
      }

      setIsHelpOpen((current) => !current);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!isHelpOpen && !isPlaylistOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      const clickedHelp = helpOverlayRef.current?.contains(target) ?? false;
      const clickedPlaylist = playlistOverlayRef.current?.contains(target) ?? false;

      if (isHelpOpen && !clickedHelp) {
        setIsHelpOpen(false);
      }

      if (!isPlaylistOpen) {
        return;
      }

      if (clickedHelp || clickedPlaylist) {
        setPlaylistOutsideClicks(0);
        return;
      }

      setPlaylistOutsideClicks((current) => {
        if (current >= 1) {
          setIsPlaylistOpen(false);
          return 0;
        }

        return 1;
      });
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [isHelpOpen, isPlaylistOpen]);

  const sessionSnapshotRef = useRef<PersistedAppState>(initialSession);
  sessionSnapshotRef.current = {
    beatSyncEnabled,
    currentTrackId: player.currentTrackId,
    isMuted: player.isMuted,
    lastSavedAt: new Date().toISOString(),
    manualBpm,
    playbackPosition: player.playbackPosition,
    playlist: player.playlist,
    repeatMode: player.repeatMode,
    shouldResumePlayback: player.isPlaying,
    skinId,
    speed,
    volume: player.volume,
  };

  useEffect(() => {
    const saveTimer = window.setTimeout(() => {
      void window.lofiDefragger.saveSession(sessionSnapshotRef.current);
    }, 800);

    return () => {
      window.clearTimeout(saveTimer);
    };
  }, [
    beatSyncEnabled,
    manualBpm,
    player.currentTrackId,
    player.isMuted,
    player.isPlaying,
    player.playlist,
    player.repeatMode,
    player.volume,
    skinId,
    speed,
  ]);

  useEffect(() => {
    if (!player.currentTrackId) {
      return;
    }

    const persistPlaybackPosition = () => {
      void window.lofiDefragger.saveSession(sessionSnapshotRef.current);
    };

    if (!player.isPlaying) {
      persistPlaybackPosition();
      return;
    }

    const intervalId = window.setInterval(persistPlaybackPosition, 3000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [player.currentTrackId, player.isPlaying]);

  const currentTrackTitle = player.currentTrack?.title ?? 'No track loaded';
  const currentTrackArtist = player.currentTrack?.artist ?? null;
  const currentTrackMissing = Boolean(player.currentTrack?.missing);
  const closePlaylist = () => {
    setIsPlaylistOpen(false);
    setPlaylistOutsideClicks(0);
  };
  const togglePlaylist = () => {
    setIsPlaylistOpen((current) => !current);
    setPlaylistOutsideClicks(0);
  };

  return (
    <DosFrame>
      <div className="app-shell" data-skin={skinId}>
        <button
          type="button"
          className={`app-shell__help-hint ${isHelpOpen ? 'app-shell__help-hint--active' : ''}`}
          onClick={() => setIsHelpOpen(true)}
        >
          F1=Help
        </button>

        <main className="app-shell__main">
          <VisualizationBoard state={simulation.state} />
          <StatusPanel
            beatSyncEnabled={beatSyncEnabled}
            currentPass={simulation.state.passNumber}
            defragProgress={simulation.rowsCompletedInPass / DEFAULT_ROWS_PER_PASS}
            elapsedSeconds={simulation.state.elapsedMs / 1000}
            isFullscreen={isFullscreen}
            manualBpm={manualBpm}
            onBeatSyncChange={setBeatSyncEnabled}
            onManualBpmChange={(value) => setManualBpm(normalizeManualBpm(value))}
            onSkinChange={setSkinId}
            onSpeedChange={setSpeed}
            onToggleFullscreen={() => {
              void window.lofiDefragger.toggleFullscreen().then((value) => {
                setIsFullscreen(value);
              });
            }}
            selectedSkinId={skinId}
            speed={speed}
            statusCluster={simulation.state.clusterNumber}
          />
          <TransportPanel
            currentTrackArtist={currentTrackArtist}
            currentTrackMissing={currentTrackMissing}
            currentTrackTitle={currentTrackTitle}
            duration={player.trackDuration}
            isMuted={player.isMuted}
            isPlaying={player.isPlaying}
            isTestMode={isTestMode}
            onImportFiles={() => {
              void player.importAudio('files');
            }}
            onImportFolder={() => {
              void player.importAudio('folder');
            }}
            onMuteToggle={() => player.setMuted(!player.isMuted)}
            onNext={player.skipNext}
            onPlayPause={player.togglePlayPause}
            onPrevious={player.skipPrevious}
            onRepeatChange={player.setRepeatMode}
            onSeek={player.seekTo}
            onTestModeToggle={() => setIsTestMode((current) => !current)}
            onVolumeChange={player.setVolume}
            playbackPosition={player.playbackPosition}
            repeatMode={player.repeatMode}
            volume={player.volume}
          />
          <PlaylistLauncherPanel
            currentTrackTitle={player.currentTrack?.title ?? null}
            isOpen={isPlaylistOpen}
            onToggle={togglePlaylist}
            playlistCount={player.playlist.length}
          />
        </main>

        <div className="app-shell__overlay-layer" aria-hidden={!isHelpOpen && !isPlaylistOpen}>
          <PlaylistPanel
            ref={playlistOverlayRef}
            currentTrackId={player.currentTrackId}
            isOpen={isPlaylistOpen}
            outsideCloseWarning={playlistOutsideClicks === 1}
            onClose={closePlaylist}
            onMoveDown={player.moveTrackDown}
            onMoveUp={player.moveTrackUp}
            onRemove={player.removeTrack}
            onSelect={(trackId) => player.selectTrack(trackId, { autoplay: true })}
            playlist={player.playlist}
          />
          <HelpOverlay ref={helpOverlayRef} isOpen={isHelpOpen} />
        </div>

        <audio
          ref={player.audioRef}
          hidden
          preload="metadata"
          onEnded={player.handleAudioEnded}
          onError={player.handleAudioError}
          onLoadedMetadata={player.handleAudioLoadedMetadata}
          onPause={player.handleAudioPause}
          onPlay={player.handleAudioPlay}
          onTimeUpdate={player.handleAudioTimeUpdate}
        />
      </div>
    </DosFrame>
  );
}

export default function App() {
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialFullscreen, setInitialFullscreen] = useState(false);
  const [initialSession, setInitialSession] = useState<PersistedAppState | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const [session, fullscreen] = await Promise.all([
          window.lofiDefragger.loadSession(),
          window.lofiDefragger.getFullscreenState(),
        ]);
        if (cancelled) {
          return;
        }
        setInitialSession(session);
        setInitialFullscreen(fullscreen);
        setIsLoading(false);
      } catch (error) {
        if (cancelled) {
          return;
        }
        console.error('Failed to initialize app state.', error);
        setLoadError('Unable to initialize the saved session.');
        setIsLoading(false);
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) {
    return (
      <DosFrame>
        <div className="boot-screen">
          <p className="boot-screen__title">Lo-fi Defragger</p>
          <p className="boot-screen__subtitle">{loadError}</p>
        </div>
      </DosFrame>
    );
  }

  if (isLoading || !initialSession) {
    return (
      <DosFrame>
        <div className="boot-screen">
          <p className="boot-screen__title">Lo-fi Defragger</p>
          <p className="boot-screen__subtitle">
            Initializing the ambient board...
          </p>
        </div>
      </DosFrame>
    );
  }

  return (
    <AppShell
      initialFullscreen={initialFullscreen}
      initialSession={initialSession}
    />
  );
}
