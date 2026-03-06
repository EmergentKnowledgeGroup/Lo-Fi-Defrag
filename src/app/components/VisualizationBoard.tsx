import type { SimulationState, SectorState } from '../../shared/types';
import { getLaneVisualState } from '../simulation/engine';

const CELL_CLASS_NAMES: Record<SectorState | 'highlight', string> = {
  bad: 'sector sector--bad',
  highlight: 'sector sector--highlight',
  reading: 'sector sector--reading',
  unmovable: 'sector sector--unmovable',
  unused: 'sector sector--unused',
  used: 'sector sector--used',
  writing: 'sector sector--writing',
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
        <span className="panel__title">Optimize</span>
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
            />
          ))}
        </div>
      </div>
    </section>
  );
}
