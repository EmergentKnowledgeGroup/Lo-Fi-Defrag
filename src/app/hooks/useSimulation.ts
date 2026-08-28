import { startTransition, useEffect, useRef, useState } from 'react';

import { DEFAULT_ROWS_PER_PASS } from '../../shared/session';
import type {
  SimulationBoardConfig,
  SimulationConfig,
  SimulationState,
} from '../../shared/types';
import {
  advanceSimulation,
  createSimulationState,
  getRowsCompletedInPass,
} from '../simulation/engine';

interface SimulationOptions {
  beatSyncEnabled: boolean;
  effectiveBpm: number | null;
  energyLevel: number;
  isRunning: boolean;
  speed: number;
}

function createSeededRandom(seed: number): () => number {
  let value = Math.max(1, seed);
  return () => {
    value = (value * 48271) % 0x7fffffff;
    return (value - 1) / 0x7ffffffe;
  };
}

/**
 * Fixed board density for the 720×500 virtual DOS canvas.
 * The board now uses strict pixel-quantized VGA-like geometry:
 * 80 columns at 9px each and 14 total rows at 16px each.
 */
const DOS_COLUMNS = 80;
const DOS_FIELD_ROWS = 13;
const DOS_BOARD_CONFIG: SimulationBoardConfig = {
  fieldBadRatio: 0.01,
  fieldUnmovableRatio: 0.015,
  fieldUsedRatio: 0.28,
  laneSeedUsedRatio: 0.15,
  minimumFieldUsedRatio: 0.18,
  reshuffleMutationRate: 0.16,
  reshuffleProtectedMutationRate: 0.04,
  reshuffleUsedTopUpChance: 0.24,
};

export function useSimulation(options: SimulationOptions): {
  rowsCompletedInPass: number;
  state: SimulationState;
} {
  const randomRef = useRef(
    createSeededRandom(Math.floor(Math.random() * 0x7fffffff) || 90210),
  );
  const config: SimulationConfig = {
    baseSpeed: options.speed,
    beatSyncEnabled: options.beatSyncEnabled,
    boardConfig: DOS_BOARD_CONFIG,
    columns: DOS_COLUMNS,
    effectiveBpm: options.effectiveBpm,
    energyLevel: options.energyLevel,
    fieldRows: DOS_FIELD_ROWS,
    rowsPerPass: DEFAULT_ROWS_PER_PASS,
  };
  const configRef = useRef(config);
  configRef.current = config;
  const [state, setState] = useState<SimulationState>(() =>
    createSimulationState(config, randomRef.current),
  );

  useEffect(() => {
    if (!options.isRunning) {
      return;
    }

    let animationFrame = 0;
    let lastFrameTime = performance.now();

    const tick = (now: number) => {
      const delta = Math.max(0, Math.min(80, now - lastFrameTime));
      lastFrameTime = now;
      startTransition(() => {
        setState((currentState) =>
          advanceSimulation(
            currentState,
            configRef.current,
            delta,
            randomRef.current,
          ).state,
        );
      });
      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [options.isRunning]);

  return {
    rowsCompletedInPass: getRowsCompletedInPass(state),
    state,
  };
}
