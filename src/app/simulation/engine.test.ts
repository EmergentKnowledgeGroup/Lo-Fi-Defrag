import { describe, expect, it } from 'vitest';

import type { SimulationConfig } from '../../shared/types';
import {
  advanceSimulation,
  createSimulationState,
  getLaneVisualState,
  selectRandomUsedSource,
} from './engine';

function sequenceRandom(values: number[]): () => number {
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
}

const BASE_CONFIG: SimulationConfig = {
  baseSpeed: 1,
  beatSyncEnabled: false,
  boardConfig: {
    fieldBadRatio: 0.01,
    fieldUnmovableRatio: 0.015,
    fieldUsedRatio: 0.28,
    laneSeedUsedRatio: 0,
    minimumFieldUsedRatio: 0.18,
    reshuffleMutationRate: 0.16,
    reshuffleProtectedMutationRate: 0.04,
    reshuffleUsedTopUpChance: 0.24,
  },
  columns: 4,
  effectiveBpm: null,
  energyLevel: 0,
  fieldRows: 2,
  rowsPerPass: 12,
};

describe('simulation engine', () => {
  it('selects sources only from used cells', () => {
    const field = [
      'unused',
      'used',
      'bad',
      'used',
      'unmovable',
      'unused',
      'used',
      'unused',
    ] as const;

    const selectedIndex = selectRandomUsedSource(
      [...field],
      new Set([1, 3]),
      sequenceRandom([0.4]),
    );

    expect(selectedIndex).toBe(6);
  });

  it('moves a source through reading, writing, then lane used', () => {
    const initialState = createSimulationState(BASE_CONFIG, sequenceRandom([0.05]));
    initialState.field = [
      'used',
      'unused',
      'unused',
      'unused',
      'unused',
      'unused',
      'unused',
      'unused',
    ];

    let tick = advanceSimulation(
      initialState,
      BASE_CONFIG,
      20,
      sequenceRandom([0, 0]),
    ).state;

    const readingIndex = tick.field.findIndex((cell) => cell === 'reading');
    expect(readingIndex).toBe(0);
    expect(tick.activeTransfers).toHaveLength(1);

    tick.pendingMoveMs = 9999;
    tick = advanceSimulation(tick, BASE_CONFIG, 200, sequenceRandom([0.3])).state;

    expect(tick.field[0]).toBe('unused');
    expect(tick.lane[0].state).toBe('writing');

    tick.pendingMoveMs = 9999;
    tick = advanceSimulation(tick, BASE_CONFIG, 200, sequenceRandom([0.3])).state;

    expect(tick.lane[0].state).toBe('used');
    expect(tick.activeTransfers).toHaveLength(0);
  });

  it('increments the pass counter after twelve completed rows', () => {
    const state = createSimulationState(
      { ...BASE_CONFIG, columns: 3 },
      sequenceRandom([0.15]),
    );
    state.lane = [{ state: 'used' }, { state: 'used' }, { state: 'used' }];
    state.pendingMoveMs = 9999;
    state.totalClearedRows = 11;

    let tick = advanceSimulation(
      state,
      { ...BASE_CONFIG, columns: 3 },
      20,
      sequenceRandom([0.15]),
    ).state;
    tick.pendingMoveMs = 9999;
    tick = advanceSimulation(
      tick,
      { ...BASE_CONFIG, columns: 3 },
      1000,
      sequenceRandom([0.15]),
    ).state;

    expect(tick.totalClearedRows).toBe(12);
    expect(tick.passNumber).toBe(2);
    expect(tick.lane.every((slot) => slot.state === 'unused')).toBe(true);
  });

  it('only highlights the lane once completion starts', () => {
    const state = createSimulationState(
      { ...BASE_CONFIG, columns: 3 },
      sequenceRandom([0.15]),
    );
    state.lane = [{ state: 'used' }, { state: 'writing' }, { state: 'unused' }];

    expect(getLaneVisualState(state, 0)).toBe('lane-used');
    expect(getLaneVisualState(state, 1)).toBe('lane-writing');
    expect(getLaneVisualState(state, 2)).toBe('unused');

    state.completion = {
      phase: 'flash',
      remainingMs: 40,
      verifyIndex: -1,
    };

    expect(getLaneVisualState(state, 0)).toBe('highlight');
    expect(getLaneVisualState(state, 2)).toBe('highlight');
  });

  it('occasionally launches two movers at higher synced speeds', () => {
    const config: SimulationConfig = {
      ...BASE_CONFIG,
      baseSpeed: 1.8,
      beatSyncEnabled: true,
      effectiveBpm: 92,
      energyLevel: 0.95,
    };
    const state = createSimulationState(config, sequenceRandom([0.02]));

    const tick = advanceSimulation(state, config, 20, sequenceRandom([0, 0, 0]));

    expect(tick.launchedTransfers).toBe(2);
    expect(tick.state.activeTransfers).toHaveLength(2);
  });

  it('skips over pre-used lane cells when picking the next destination', () => {
    const boardConfig = BASE_CONFIG.boardConfig ?? {
      fieldBadRatio: 0.01,
      fieldUnmovableRatio: 0.015,
      fieldUsedRatio: 0.28,
      laneSeedUsedRatio: 0,
      minimumFieldUsedRatio: 0.18,
      reshuffleMutationRate: 0.16,
      reshuffleProtectedMutationRate: 0.04,
      reshuffleUsedTopUpChance: 0.24,
    };
    const config: SimulationConfig = {
      ...BASE_CONFIG,
      columns: 4,
      boardConfig: {
        ...boardConfig,
        laneSeedUsedRatio: 0.15,
      },
    };
    const state = createSimulationState(config, sequenceRandom([0.95]));
    state.lane = [
      { state: 'used' },
      { state: 'unused' },
      { state: 'unused' },
      { state: 'unused' },
    ];
    state.field = [
      'used',
      'unused',
      'unused',
      'unused',
      'unused',
      'unused',
      'unused',
      'unused',
    ];

    const tick = advanceSimulation(
      state,
      config,
      20,
      sequenceRandom([0, 0]),
    ).state;

    expect(tick.activeTransfers[0]?.laneIndex).toBe(1);
  });
});
