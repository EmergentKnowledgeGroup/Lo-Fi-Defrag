import type { RepeatMode } from '../../shared/types';
import { formatDuration } from '../formatters';

interface TransportPanelProps {
  analysisEnergy: number;
  bpmStatus: 'idle' | 'listening' | 'ready';
  currentTrackArtist: string | null;
  currentTrackTitle: string;
  currentTrackMissing: boolean;
  duration: number;
  isMuted: boolean;
  isPlaying: boolean;
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
  analysisEnergy,
  bpmStatus,
  currentTrackArtist,
  currentTrackTitle,
  currentTrackMissing,
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

      <div className="transport__track">
        <div>
          <p className="transport__eyebrow">Now Playing</p>
          <h2 className="transport__title">{currentTrackTitle}</h2>
          <p className="transport__subtitle">
            {currentTrackArtist || 'Unknown artist'}
          </p>
        </div>
        <div className="energy-meter" aria-label="Audio energy meter">
          <div
            className="energy-meter__fill"
            style={{ width: `${Math.max(8, analysisEnergy * 100)}%` }}
          />
        </div>
      </div>

      <div className="transport__progress">
        <input
          className="control__range"
          type="range"
          min="0"
          max={Math.max(duration, playbackPosition, 1)}
          step="0.1"
          value={playbackPosition}
          onChange={(event) => onSeek(Number(event.target.value))}
        />
        <div className="transport__timecodes">
          <span>{formatDuration(playbackPosition)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      <div className="transport__controls">
        <button className="button" onClick={onPrevious}>
          Prev
        </button>
        <button className="button button--primary" onClick={() => void onPlayPause()}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button className="button" onClick={onNext}>
          Next
        </button>
      </div>

      <div className="transport__controls transport__controls--secondary">
        <button className="button button--secondary" onClick={onImportFiles}>
          Import Files
        </button>
        <button className="button button--secondary" onClick={onImportFolder}>
          Import Folder
        </button>
        <button className="button button--secondary" onClick={onMuteToggle}>
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
      </div>

      <div className="transport__footer">
        <div className="transport__volume">
          <span className="transport__eyebrow">Volume</span>
          <input
            className="control__range"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(event) => onVolumeChange(Number(event.target.value))}
          />
        </div>

        <div className="repeat-toggle" role="radiogroup" aria-label="Repeat mode">
          {REPEAT_OPTIONS.map((option) => (
            <button
              key={option}
              className={`repeat-toggle__button ${
                repeatMode === option ? 'repeat-toggle__button--active' : ''
              }`}
              onClick={() => onRepeatChange(option)}
            >
              {option === 'off'
                ? 'Repeat Off'
                : option === 'one'
                  ? 'Repeat 1'
                  : 'Repeat All'}
            </button>
          ))}
        </div>
      </div>

      <p
        className={`transport__status ${
          currentTrackMissing ? 'transport__status--warning' : ''
        }`}
      >
        {currentTrackMissing
          ? 'Current file is missing. Pick another track or re-import the source.'
          : bpmStatus === 'listening'
            ? 'Listening to the beat so the board can pick up the cadence.'
            : 'The board keeps running even when no track is playing.'}
      </p>
    </section>
  );
}
