import type { CSSProperties } from 'react';
import type { SimulationState, SectorState } from '../../shared/types';
import { getLaneVisualState, type LaneVisualState } from '../simulation/engine';

const CELL_CLASS: Record<SectorState | LaneVisualState, string> = {
  bad: 'board-cell--bad',
  highlight: 'board-cell--highlight',
  'lane-used': 'board-cell--lane-used',
  'lane-writing': 'board-cell--lane-writing',
  reading: 'board-cell--reading',
  unmovable: 'board-cell--unmovable',
  unused: 'board-cell--unused',
  used: 'board-cell--used',
  writing: 'board-cell--writing',
};

const BOARD_CELL_WIDTH = 9;
const BOARD_CELL_HEIGHT = 17;

interface VisualizationBoardProps {
  state: SimulationState;
}

function getCellGlyph(state: SectorState | LaneVisualState): string | null {
  if (state === 'bad') {
    return 'B';
  }
  if (state === 'unmovable') {
    return 'X';
  }
  if (state === 'unused') {
    return '\u2591';
  }
  return null;
}

export function VisualizationBoard({ state }: VisualizationBoardProps) {
  const { columns } = state;
  const cells = [
    ...state.lane.map((_slot, i) => getLaneVisualState(state, i)),
    ...state.field,
  ];
  const boardStyle: CSSProperties = {
    gridTemplateColumns: `repeat(${columns}, ${BOARD_CELL_WIDTH}px)`,
    gridTemplateRows: `repeat(${state.fieldRows + 1}, ${BOARD_CELL_HEIGHT}px)`,
    height: `${(state.fieldRows + 1) * BOARD_CELL_HEIGHT}px`,
    width: `${columns * BOARD_CELL_WIDTH}px`,
  };

  return (
    <section className="panel panel--board">
      <div className="panel__titlebar">
        <span className="panel__title">Lo-fi Defragger</span>
      </div>
      <div className="board-grid" style={boardStyle} aria-hidden="true">
        {cells.map((cellState, index) => {
          const glyph = getCellGlyph(cellState);
          const glyphClassName =
            cellState === 'unused'
              ? 'board-cell__face board-cell__face--shade'
              : 'board-cell__face board-cell__face--symbol';
          return (
            <span
              key={index}
              className={`board-cell ${CELL_CLASS[cellState]}`}
            >
              {glyph ? <span className={glyphClassName}>{glyph}</span> : null}
            </span>
          );
        })}
      </div>
    </section>
  );
}
