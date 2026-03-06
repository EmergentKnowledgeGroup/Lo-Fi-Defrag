import { useEffect, useState } from 'react';

import { DEFAULT_ROWS_PER_PASS } from '../shared/session';
import type { PersistedAppState, SkinId } from '../shared/types';
import { PlaylistPanel } from './components/PlaylistPanel';
import { StatusPanel } from './components/StatusPanel';
import { TransportPanel } from './components/TransportPanel';
import { VisualizationBoard } from './components/VisualizationBoard';
import { getSkin } from './skins';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useSimulation } from './hooks/useSimulation';

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
  const [skinId, setSkinId] = useState<SkinId>(initialSession.skinId);
  const [speed, setSpeed] = useState(initialSession.speed);
  const [beatSyncEnabled, setBeatSyncEnabled] = useState(
    initialSession.beatSyncEnabled,
  );
  const [manualBpm, setManualBpm] = useState(
    normalizeManualBpm(initialSession.manualBpm ?? 92),
  );
  const [isFullscreen, setIsFullscreen] = useState(initialFullscreen);
  const selectedSkin = getSkin(skinId);
  const player = useAudioPlayer(initialSession);
  const effectiveBpm = beatSyncEnabled
    ? player.estimatedBpm ?? manualBpm
    : null;
  const simulation = useSimulation({
    beatSyncEnabled,
    effectiveBpm,
    energyLevel: player.energyLevel,
    isRunning: player.isPlaying,
    speed,
  });

  useEffect(() => {
    return window.lofiDefragger.onFullscreenChanged((value) => {
      setIsFullscreen(value);
    });
  }, []);

  useEffect(() => {
    const saveTimer = window.setTimeout(() => {
      void window.lofiDefragger.saveSession({
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
      });
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
    player.playbackPosition,
    player.playlist,
    player.repeatMode,
    player.volume,
    skinId,
    speed,
  ]);

  const currentLaneFill = simulation.state.lane.filter(
    (slot) => slot.state === 'used' || slot.state === 'writing',
  ).length;
  const currentTrackTitle = player.currentTrack?.title ?? 'No track loaded';
  const currentTrackArtist = player.currentTrack?.artist ?? null;
  const currentTrackMissing = Boolean(player.currentTrack?.missing);

  return (
    <div className="app-shell" data-skin={skinId}>
      <main className="app-shell__main">
        <VisualizationBoard state={simulation.state} />
        <StatusPanel
          beatSyncEnabled={beatSyncEnabled}
          bpmStatus={player.bpmStatus}
          currentLaneCapacity={simulation.state.columns}
          currentLaneFill={currentLaneFill}
          currentPass={simulation.state.passNumber}
          defragProgress={simulation.rowsCompletedInPass / DEFAULT_ROWS_PER_PASS}
          effectiveBpm={effectiveBpm}
          elapsedSeconds={simulation.state.elapsedMs / 1000}
          estimatedBpm={player.estimatedBpm}
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
          rowsCompletedInPass={simulation.rowsCompletedInPass}
          rowsPerPass={DEFAULT_ROWS_PER_PASS}
          selectedSkinId={skinId}
          speed={speed}
          statusCluster={simulation.state.clusterNumber}
        />
        <TransportPanel
          analysisEnergy={player.energyLevel}
          bpmStatus={player.bpmStatus}
          currentTrackArtist={currentTrackArtist}
          currentTrackMissing={currentTrackMissing}
          currentTrackTitle={currentTrackTitle}
          duration={player.trackDuration}
          isMuted={player.isMuted}
          isPlaying={player.isPlaying}
          isTrackLoaded={Boolean(player.currentTrack)}
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
          onVolumeChange={player.setVolume}
          playbackPosition={player.playbackPosition}
          repeatMode={player.repeatMode}
          volume={player.volume}
        />
        <PlaylistPanel
          currentTrackId={player.currentTrackId}
          onMoveDown={player.moveTrackDown}
          onMoveUp={player.moveTrackUp}
          onRemove={player.removeTrack}
          onSelect={(trackId) => player.selectTrack(trackId, { autoplay: true })}
          playlist={player.playlist}
        />
      </main>

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
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialFullscreen, setInitialFullscreen] = useState(false);
  const [initialSession, setInitialSession] = useState<PersistedAppState | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
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
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading || !initialSession) {
    return (
      <div className="boot-screen">
        <p className="boot-screen__title">Lo-fi Defragger</p>
        <p className="boot-screen__subtitle">Initializing the ambient board...</p>
      </div>
    );
  }

  return (
    <AppShell
      initialFullscreen={initialFullscreen}
      initialSession={initialSession}
    />
  );
}
