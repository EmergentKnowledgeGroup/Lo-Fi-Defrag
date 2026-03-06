import type { SkinId } from '../../shared/types';
import { formatClock } from '../formatters';
import { SKINS } from '../skins';
import { AsciiBar } from './AsciiBar';

interface StatusPanelProps {
  beatSyncEnabled: boolean;
  currentPass: number;
  defragProgress: number;
  elapsedSeconds: number;
  isFullscreen: boolean;
  manualBpm: number;
  onBeatSyncChange: (value: boolean) => void;
  onManualBpmChange: (value: number) => void;
  onSkinChange: (value: SkinId) => void;
  onSpeedChange: (value: number) => void;
  onToggleFullscreen: () => void;
  selectedSkinId: SkinId;
  speed: number;
  statusCluster: number;
}

const LEGEND_ITEMS = [
  { label: 'Used', cls: 'cell--used', char: '\u2588' },
  { label: 'Reading', cls: 'cell--reading', char: '\u2588' },
  { label: 'Bad', cls: 'cell--bad', char: 'B' },
  { label: 'Unused', cls: 'cell--unused', char: '\u00B7' },
  { label: 'Writing', cls: 'cell--writing', char: '\u2588' },
  { label: 'Unmovable', cls: 'cell--unmovable', char: 'X' },
] as const;

export function StatusPanel({
  beatSyncEnabled,
  currentPass,
  defragProgress,
  elapsedSeconds,
  isFullscreen,
  manualBpm,
  onBeatSyncChange,
  onManualBpmChange,
  onSkinChange,
  onSpeedChange,
  onToggleFullscreen,
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

      <div className="status-row">
        <span>Cluster {statusCluster}</span>
        <span>Elapsed {formatClock(elapsedSeconds)}</span>
        <span>Pass {currentPass}</span>
        <AsciiBar value={defragProgress} tiles={20} label="Defrag progress" />
        <span>{Math.round(defragProgress * 100)}%</span>
      </div>

      <div className="legend-row">
        {LEGEND_ITEMS.map((item) => (
          <span key={item.label} className="legend-row__item">
            <span className={`legend-row__char ${item.cls}`}>{item.char}</span>
            <span>{item.label}</span>
          </span>
        ))}
      </div>

      <div className="controls-row">
        <label className="controls-row__item">
          <span>Skin</span>
          <select
            value={selectedSkinId}
            onChange={(e) => onSkinChange(e.target.value as SkinId)}
          >
            {SKINS.map((skin) => (
              <option key={skin.id} value={skin.id}>
                {skin.label}
              </option>
            ))}
          </select>
        </label>
        <label className="controls-row__item">
          <span>Speed</span>
          <input
            type="range"
            min="0.45"
            max="2"
            step="0.05"
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
          />
          <span>{speed.toFixed(2)}x</span>
        </label>
        <label className="controls-row__item">
          <span>Sync</span>
          <input
            type="checkbox"
            checked={beatSyncEnabled}
            onChange={(e) => onBeatSyncChange(e.target.checked)}
          />
        </label>
        <label className="controls-row__item">
          <span>BPM</span>
          <input
            type="number"
            min="60"
            max="160"
            value={manualBpm}
            onChange={(e) => onManualBpmChange(Number(e.target.value))}
          />
        </label>
        <button
          type="button"
          className="button"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? 'Win' : 'FS'}
        </button>
      </div>
    </section>
  );
}
