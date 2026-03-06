import { Fragment } from 'react';
import type { SimulationState, SectorState } from '../../shared/types';
import { getLaneVisualState, type LaneVisualState } from '../simulation/engine';

/** Single block character per cell — the DOS way. */
const CELL_CHAR: Record<SectorState | LaneVisualState, string> = {
  bad: 'B',
  highlight: '\u2588',
  'lane-used': '\u2588',
  'lane-writing': '\u2588',
  reading: '\u2588',
  unmovable: 'X',
  unused: ' ',
  used: '\u2588',
  writing: '\u2588',
};

/** CSS class per cell state — controls foreground color only. */
const CELL_CLASS: Record<SectorState | LaneVisualState, string> = {
  bad: 'cell--bad',
  highlight: 'cell--highlight',
  'lane-used': 'cell--lane',
  'lane-writing': 'cell--lane',
  reading: 'cell--reading',
  unmovable: 'cell--unmovable',
  unused: 'cell--unused',
  used: 'cell--used',
  writing: 'cell--writing',
};

interface VisualizationBoardProps {
  state: SimulationState;
}

export function VisualizationBoard({ state }: VisualizationBoardProps) {
  const { columns } = state;

  return (
    <section className="panel panel--board">
      <div className="panel__titlebar">
        <span className="panel__title">Lo-fi Defragger</span>
        <span className="panel__meta">F1=Help</span>
      </div>
      <pre className="board-text" aria-hidden="true">
        {/* Lane row */}
        {state.lane.map((_slot, i) => {
          const s = getLaneVisualState(state, i);
          return (
            <span key={`l${i}`} className={CELL_CLASS[s]}>
              {CELL_CHAR[s]}
            </span>
          );
        })}
        {'\n'}
        {/* Field rows */}
        {state.field.map((cellState, i) => (
          <Fragment key={i}>
            <span className={CELL_CLASS[cellState]}>
              {CELL_CHAR[cellState]}
            </span>
            {(i + 1) % columns === 0 ? '\n' : null}
          </Fragment>
        ))}
      </pre>
    </section>
  );
}
