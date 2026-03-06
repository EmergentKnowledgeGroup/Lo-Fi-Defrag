import type { SimulationState, SectorState } from '../../shared/types';
import { getLaneVisualState, type LaneVisualState } from '../simulation/engine';

const CELL_CLASS_NAMES: Record<SectorState | LaneVisualState, string> = {
  bad: 'sector sector--bad',
  highlight: 'sector sector--highlight',
  'lane-used': 'sector sector--lane-used',
  'lane-writing': 'sector sector--lane-writing',
  reading: 'sector sector--reading',
  unmovable: 'sector sector--unmovable',
  unused: 'sector sector--unused',
  used: 'sector sector--used',
  writing: 'sector sector--writing',
};

const CELL_TOKENS: Record<SectorState | LaneVisualState, string> = {
  bad: 'B',
  highlight: '.',
  'lane-used': '.',
  'lane-writing': 'W',
  reading: 'R',
  unmovable: 'X',
  unused: '',
  used: '.',
  writing: 'W',
};

interface VisualizationBoardProps {
  state: SimulationState;
}

export function VisualizationBoard({
  state,
}: VisualizationBoardProps) {
  const laneTemplateColumns = `repeat(${state.columns}, minmax(0, 1fr))`;
  const fieldTemplateColumns = `repeat(${state.columns}, minmax(0, 1fr))`;

  return (
    <section className="panel panel--board">
      <div className="panel__titlebar">
        <span className="panel__title">Lo-fi Defragger</span>
        <span className="panel__meta">F1=Help</span>
      </div>
      <div className="board-shell">
        <div
          className="board-shell__lane"
          style={{ gridTemplateColumns: laneTemplateColumns }}
        >
          {state.lane.map((_slot, laneIndex) => {
            const laneState = getLaneVisualState(state, laneIndex);
            return (
              <div
                key={`lane-${laneIndex}`}
                aria-hidden="true"
                className={CELL_CLASS_NAMES[laneState]}
                data-token={CELL_TOKENS[laneState]}
              />
            );
          })}
        </div>
        <div
          className="board-shell__field"
          style={{ gridTemplateColumns: fieldTemplateColumns }}
        >
          {state.field.map((cellState, cellIndex) => (
            <div
              key={`field-${cellIndex}`}
              aria-hidden="true"
              className={CELL_CLASS_NAMES[cellState]}
              data-token={CELL_TOKENS[cellState]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
