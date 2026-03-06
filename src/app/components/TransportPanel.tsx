import type { RepeatMode } from '../../shared/types';
import { formatDuration } from '../formatters';
import { AsciiBar } from './AsciiBar';

interface TransportPanelProps {
  analysisEnergy: number;
  bpmStatus: 'idle' | 'listening' | 'ready';
  currentTrackArtist: string | null;
  currentTrackTitle: string;
  currentTrackMissing: boolean;
  duration: number;
  isMuted: boolean;
  isPlaying: boolean;
  isTrackLoaded: boolean;
  onImportFiles: () => void;
  onImportFolder: () => void;
  onMuteToggle: () => void;
  onNext: () => void;
  onPlayPause: () => Promise<void>;
  onPrevious: () => void;
  onRepeatChange: (value: RepeatMode) => void;
  onSeek: (position: number) => void;
  onVolumeChange: (value: number) => void;
  playbackPosition: number;
  repeatMode: RepeatMode;
  volume: number;
}

const REPEAT_OPTIONS: RepeatMode[] = ['off', 'one', 'all'];

export function TransportPanel({
  currentTrackArtist,
  currentTrackTitle,
  duration,
  isMuted,
  isPlaying,
  onImportFiles,
  onImportFolder,
  onMuteToggle,
  onNext,
  onPlayPause,
  onPrevious,
  onRepeatChange,
  onSeek,
  onVolumeChange,
  playbackPosition,
  repeatMode,
  volume,
}: TransportPanelProps) {
  return (
    <section className="panel panel--transport">
      <div className="panel__titlebar">
        <span className="panel__title">Player</span>
        <span className="panel__meta">Local Files</span>
      </div>

      {/* Row 1 - Track info */}
      <div className="transport-row">
        <span className="transport-row__status">{isPlaying ? '\u25B6' : '\u23F8'}</span>
        <span className="transport-row__title">{currentTrackTitle}</span>
        <span className="transport-row__artist">{currentTrackArtist || 'Unknown artist'}</span>
      </div>

      {/* Row 2 - Seek bar */}
      <div className="transport-row">
        <AsciiBar
          value={duration > 0 ? playbackPosition / duration : 0}
          tiles={30}
          showHead
          onClick={(v) => onSeek(v * Math.max(duration, 1))}
          label="Seek"
        />
        <span className="transport-row__time">
          {formatDuration(playbackPosition)} / {formatDuration(duration)}
        </span>
      </div>

      {/* Row 3 - Transport buttons */}
      <div className="transport-row">
        <button className="button" onClick={onPrevious}>Prev</button>
        <button className="button button--primary" onClick={() => void onPlayPause()}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button className="button" onClick={onNext}>Next</button>
        <button className="button" onClick={onImportFiles}>Import</button>
        <button className="button" onClick={onImportFolder}>Folder</button>
        <button className="button" onClick={onMuteToggle}>{isMuted ? 'Unmute' : 'Mute'}</button>
      </div>

      {/* Row 4 - Volume + Repeat */}
      <div className="transport-row">
        <span>Vol:</span>
        <AsciiBar
          value={volume}
          tiles={10}
          onClick={onVolumeChange}
          label="Volume"
        />
        <span>Repeat:</span>
        {REPEAT_OPTIONS.map((option) => (
          <button
            key={option}
            className={`button ${repeatMode === option ? 'button--primary' : ''}`}
            onClick={() => onRepeatChange(option)}
          >
            {option === 'off' ? 'Off' : option === 'one' ? '1' : 'All'}
          </button>
        ))}
      </div>
    </section>
  );
}
