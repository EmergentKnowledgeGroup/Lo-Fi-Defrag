import type { SkinId } from '../../shared/types';
import { formatClock, formatSpeedLabel } from '../formatters';
import { SKINS } from '../skins';

interface StatusPanelProps {
  beatSyncEnabled: boolean;
  bpmStatus: 'idle' | 'listening' | 'ready';
  currentLaneFill: number;
  currentPass: number;
  effectiveBpm: number | null;
  elapsedSeconds: number;
  estimatedBpm: number | null;
  isFullscreen: boolean;
  manualBpm: number;
  onBeatSyncChange: (value: boolean) => void;
  onManualBpmChange: (value: number) => void;
  onSkinChange: (value: SkinId) => void;
  onSpeedChange: (value: number) => void;
  onToggleFullscreen: () => void;
  rowsCompletedInPass: number;
  rowsPerPass: number;
  selectedSkinId: SkinId;
  speed: number;
  statusCluster: number;
}

const LEGEND_ITEMS = [
  { label: 'Used', state: 'used' },
  { label: 'Reading', state: 'reading' },
  { label: 'Bad', state: 'bad' },
  { label: 'Unused', state: 'unused' },
  { label: 'Writing', state: 'writing' },
  { label: 'Unmovable', state: 'unmovable' },
] as const;

export function StatusPanel({
  beatSyncEnabled,
  bpmStatus,
  currentLaneFill,
  currentPass,
  effectiveBpm,
  elapsedSeconds,
  estimatedBpm,
  isFullscreen,
  manualBpm,
  onBeatSyncChange,
  onManualBpmChange,
  onSkinChange,
  onSpeedChange,
  onToggleFullscreen,
  rowsCompletedInPass,
  rowsPerPass,
  selectedSkinId,
  speed,
  statusCluster,
}: StatusPanelProps) {
  return (
    <section className="panel panel--status">
      <div className="panel__titlebar">
        <span className="panel__title">Status</span>
        <span className="panel__meta">Continuous Optimization</span>
      </div>
      <div className="status-grid">
        <div className="status-grid__card">
          <p className="status-grid__eyebrow">Cluster</p>
          <p className="status-grid__value">Cluster {statusCluster}</p>
          <p className="status-grid__small">Pass {currentPass}</p>
          <p className="status-grid__small">Elapsed {formatClock(elapsedSeconds)}</p>
        </div>
        <div className="status-grid__card">
          <p className="status-grid__eyebrow">Current Row</p>
          <p className="status-grid__value">
            {currentLaneFill} / {rowsPerPass} sectors queued
          </p>
          <div className="meter">
            <div
              className="meter__fill"
              style={{ width: `${(rowsCompletedInPass / rowsPerPass) * 100}%` }}
            />
          </div>
          <p className="status-grid__small">
            Rows this pass {rowsCompletedInPass} / {rowsPerPass}
          </p>
        </div>
        <div className="status-grid__card">
          <p className="status-grid__eyebrow">Cadence</p>
          <p className="status-grid__value">{formatSpeedLabel(speed)}</p>
          <p className="status-grid__small">
            {beatSyncEnabled
              ? estimatedBpm
                ? `Auto BPM ${estimatedBpm}`
                : bpmStatus === 'listening'
                  ? 'Listening for BPM...'
                  : `Manual BPM ${manualBpm}`
              : 'Manual speed only'}
          </p>
          <p className="status-grid__small">
            Effective BPM {effectiveBpm ? effectiveBpm : 'Off'}
          </p>
        </div>
      </div>

      <div className="controls-grid">
        <label className="control">
          <span className="control__label">Skin</span>
          <select
            className="control__select"
            value={selectedSkinId}
            onChange={(event) => onSkinChange(event.target.value as SkinId)}
          >
            {SKINS.map((skin) => (
              <option key={skin.id} value={skin.id}>
                {skin.label}
              </option>
            ))}
          </select>
        </label>

        <label className="control">
          <span className="control__label">Speed</span>
          <input
            className="control__range"
            type="range"
            min="0.45"
            max="2"
            step="0.05"
            value={speed}
            onChange={(event) => onSpeedChange(Number(event.target.value))}
          />
          <span className="control__hint">{speed.toFixed(2)}x</span>
        </label>

        <label className="control control--inline">
          <span className="control__label">Beat Sync</span>
          <input
            checked={beatSyncEnabled}
            className="control__checkbox"
            type="checkbox"
            onChange={(event) => onBeatSyncChange(event.target.checked)}
          />
        </label>

        <label className="control">
          <span className="control__label">Manual BPM</span>
          <input
            className="control__number"
            type="number"
            min="60"
            max="160"
            value={manualBpm}
            onChange={(event) => onManualBpmChange(Number(event.target.value))}
          />
        </label>

        <button className="button button--secondary" onClick={onToggleFullscreen}>
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
      </div>

      <div className="legend">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="legend__item">
            <span className={`legend__swatch sector sector--${item.state}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
