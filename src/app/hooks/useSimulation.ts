import { startTransition, useEffect, useRef, useState } from 'react';

import { DEFAULT_ROWS_PER_PASS } from '../../shared/session';
import type { SimulationConfig, SimulationState } from '../../shared/types';
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

interface ViewportDimensions {
  height: number;
  width: number;
}

function createSeededRandom(seed: number): () => number {
  let value = Math.max(1, seed);
  return () => {
    value = (value * 48271) % 0x7fffffff;
    return (value - 1) / 0x7ffffffe;
  };
}

function getViewportDimensions(): ViewportDimensions {
  if (typeof window === 'undefined') {
    return { height: 900, width: 1440 };
  }

  return {
    height: window.innerHeight,
    width: window.innerWidth,
  };
}

/**
 * Compute grid density based on viewport.
 * Each cell is a single monospace character (~7px wide, ~14px tall at 12px font).
 * We want the grid to fill most of the window, leaving ~180px for bottom panels.
 */
function getBoardDensity(viewport: ViewportDimensions): Pick<
  SimulationConfig,
  'columns' | 'fieldRows'
> {
  const charWidth = 7.2;
  const charHeight = 14;
  const bottomPanelHeight = 180;
  const titleBarHeight = 24;
  const availableWidth = viewport.width - 4; // 2px padding each side
  const availableHeight = viewport.height - bottomPanelHeight - titleBarHeight;
  const columns = Math.max(40, Math.floor(availableWidth / charWidth));
  const fieldRows = Math.max(12, Math.floor(availableHeight / charHeight));
  return { columns, fieldRows };
}

export function useSimulation(options: SimulationOptions): {
  rowsCompletedInPass: number;
  state: SimulationState;
} {
  const randomRef = useRef(
    createSeededRandom(Math.floor(Math.random() * 0x7fffffff) || 90210),
  );
  const [viewport, setViewport] = useState<ViewportDimensions>(getViewportDimensions);
  const density = getBoardDensity(viewport);
  const config: SimulationConfig = {
    baseSpeed: options.speed,
    beatSyncEnabled: options.beatSyncEnabled,
    columns: density.columns,
    effectiveBpm: options.effectiveBpm,
    energyLevel: options.energyLevel,
    fieldRows: density.fieldRows,
    rowsPerPass: DEFAULT_ROWS_PER_PASS,
  };
  const configRef = useRef(config);
  configRef.current = config;
  const [state, setState] = useState<SimulationState>(() =>
    createSimulationState(config, randomRef.current),
  );

  useEffect(() => {
    const handleResize = () => {
      setViewport(getViewportDimensions());
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    setState((currentState) => {
      if (
        currentState.columns === config.columns &&
        currentState.fieldRows === config.fieldRows
      ) {
        return currentState;
      }
      return createSimulationState(config, randomRef.current);
    });
  }, [config.columns, config.fieldRows]);

  useEffect(() => {
    if (!options.isRunning) {
      return;
    }

    let animationFrame = 0;
    let lastFrameTime = performance.now();

    const tick = (now: number) => {
      const delta = Math.min(80, now - lastFrameTime);
      lastFrameTime = now;
      startTransition(() => {
        setState((currentState) =>
          advanceSimulation(
            currentState,
            configRef.current,
            Math.max(16, delta),
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
