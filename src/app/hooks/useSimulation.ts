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

function getBoardDensity(viewport: ViewportDimensions): Pick<
  SimulationConfig,
  'columns' | 'fieldRows'
> {
  if (viewport.width < 760) {
    return { columns: 34, fieldRows: viewport.height < 760 ? 11 : 13 };
  }
  if (viewport.width < 1100) {
    return { columns: 48, fieldRows: viewport.height < 800 ? 15 : 17 };
  }
  if (viewport.width < 1480) {
    return { columns: 64, fieldRows: viewport.height < 860 ? 18 : 20 };
  }
  return { columns: 82, fieldRows: viewport.height < 940 ? 22 : 24 };
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
  }, []);

  return {
    rowsCompletedInPass: getRowsCompletedInPass(state),
    state,
  };
}
