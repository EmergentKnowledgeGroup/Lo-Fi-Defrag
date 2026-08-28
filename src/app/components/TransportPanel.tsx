import type { RepeatMode } from '../../shared/types';
import { formatDuration } from '../formatters';
import { AsciiBar } from './AsciiBar';

interface TransportPanelProps {
  currentTrackArtist: string | null;
  currentTrackMissing: boolean;
  currentTrackTitle: string;
  duration: number;
  isMuted: boolean;
  isPlaying: boolean;
  isTestMode: boolean;
  importError: string | null;
  onMuteToggle: () => void;
  onNext: () => void;
  onPlayPause: () => Promise<void>;
  onPrevious: () => void;
  onRepeatChange: (value: RepeatMode) => void;
  onSeek: (position: number) => void;
  onTestModeToggle: () => void;
  onVolumeChange: (value: number) => void;
  playbackPosition: number;
  repeatMode: RepeatMode;
  volume: number;
}

const REPEAT_OPTIONS: RepeatMode[] = ['off', 'one', 'all'];

export function TransportPanel({
  currentTrackArtist,
  currentTrackMissing,
  currentTrackTitle,
  duration,
  isMuted,
  isPlaying,
  isTestMode,
  importError,
  onMuteToggle,
  onNext,
  onPlayPause,
  onPrevious,
  onRepeatChange,
  onSeek,
  onTestModeToggle,
  onVolumeChange,
  playbackPosition,
  repeatMode,
  volume,
}: TransportPanelProps) {
  const canSeek = duration > 0;
  const playbackProgress = canSeek ? playbackPosition / duration : 0;
  const isBoardRunning = isPlaying || isTestMode;
  const handlePlayPause = () => {
    void onPlayPause().catch((error) => {
      console.error('Play/pause action failed.', error);
    });
  };
  const statusMessage = importError
    ? importError
    : currentTrackMissing
    ? 'Current file is missing. Pick another track or re-import the source.'
    : isPlaying
      ? 'Playback running. The defrag board is following the active track.'
      : isTestMode
        ? 'Test mode running. The defrag board is animating without audio.'
      : 'Playback paused. The defrag board is idle until a track starts.';

  return (
    <section className="panel panel--transport">
      <div className="panel__titlebar">
        <span className="panel__title">Player</span>
        <span className="panel__meta">Local Files</span>
      </div>

      {/* Row 1 - Track info */}
      <div className="transport-row">
        <span className="transport-row__status">{isBoardRunning ? '\u25B6' : '\u23F8'}</span>
        <span className="transport-row__title">{currentTrackTitle}</span>
        <span className="transport-row__artist">{currentTrackArtist || 'Unknown artist'}</span>
      </div>

      {/* Row 2 - Seek bar */}
      <div className="transport-row">
        <AsciiBar
          value={playbackProgress}
          tiles={30}
          showHead
          onChange={canSeek ? (nextValue) => onSeek(nextValue * duration) : undefined}
          label="Seek"
        />
        <span className="transport-row__time">
          {formatDuration(playbackPosition)} / {formatDuration(duration)}
        </span>
      </div>

      {/* Row 3 - Transport buttons */}
      <div className="transport-row">
        <button type="button" className="button" onClick={onPrevious}>
          Prev
        </button>
        <button
          type="button"
          className="button button--primary"
          onClick={handlePlayPause}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          className={`button ${isTestMode ? 'button--primary' : ''}`}
          onClick={onTestModeToggle}
        >
          {isTestMode ? 'Stop Test' : 'Test'}
        </button>
        <button type="button" className="button" onClick={onNext}>
          Next
        </button>
        <button type="button" className="button" onClick={onMuteToggle}>
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
      </div>

      {/* Row 4 - Volume + Repeat */}
      <div className="transport-row">
        <span>Vol:</span>
        <AsciiBar
          value={volume}
          tiles={10}
          onChange={onVolumeChange}
          label="Volume"
        />
        <span>Repeat:</span>
        {REPEAT_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            className={`button ${repeatMode === option ? 'button--primary' : ''}`}
            onClick={() => onRepeatChange(option)}
          >
            {option === 'off' ? 'Off' : option === 'one' ? '1' : 'All'}
          </button>
        ))}
      </div>

      <p
        aria-live="polite"
        className={`transport-status ${
          currentTrackMissing || importError ? 'transport-status--warning' : ''
        }`}
      >
        {statusMessage}
      </p>
    </section>
  );
}
