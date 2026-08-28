import type {
  ActiveTransfer,
  CompletionState,
  LaneSlot,
  SectorState,
  SimulationBoardConfig,
  SimulationConfig,
  SimulationState,
  SimulationTickResult,
} from '../../shared/types';

type RandomSource = () => number;
export type LaneVisualState =
  | 'unused'
  | 'lane-used'
  | 'lane-writing'
  | 'highlight';

interface MotionProfile {
  dualMoveChance: number;
  flashMs: number;
  moveIntervalMs: number;
  readingMs: number;
  verifyStepMs: number;
  writingMs: number;
}

const DEFAULT_BOARD_CONFIG: SimulationBoardConfig = {
  fieldBadRatio: 0.01,
  fieldUnmovableRatio: 0.015,
  fieldUsedRatio: 0.28,
  laneSeedUsedRatio: 0,
  minimumFieldUsedRatio: 0.18,
  reshuffleMutationRate: 0.16,
  reshuffleProtectedMutationRate: 0.04,
  reshuffleUsedTopUpChance: 0.24,
} as const;

function getBoardConfig(
  config: Pick<SimulationConfig, 'boardConfig'>,
): SimulationBoardConfig {
  return config.boardConfig ?? DEFAULT_BOARD_CONFIG;
}

function createClusterNumber(random: RandomSource): number {
  return 100 + Math.floor(random() * 900);
}

function createLane(
  columns: number,
  random: RandomSource,
  boardConfig: SimulationBoardConfig,
): LaneSlot[] {
  return Array.from({ length: columns }, () => ({
    state: random() < boardConfig.laneSeedUsedRatio ? 'used' : 'unused',
  }));
}

function sampleFieldState(
  random: RandomSource,
  boardConfig: SimulationBoardConfig,
): SectorState {
  const roll = random();
  if (roll < boardConfig.fieldUsedRatio) {
    return 'used';
  }
  if (roll > 1 - boardConfig.fieldBadRatio) {
    return 'bad';
  }
  if (roll > 1 - (boardConfig.fieldBadRatio + boardConfig.fieldUnmovableRatio)) {
    return 'unmovable';
  }
  return 'unused';
}

function createField(
  columns: number,
  fieldRows: number,
  random: RandomSource,
  boardConfig: SimulationBoardConfig,
): SectorState[] {
  const cellCount = columns * fieldRows;
  return Array.from({ length: cellCount }, () =>
    sampleFieldState(random, boardConfig),
  );
}

function cloneState(state: SimulationState): SimulationState {
  return {
    ...state,
    activeTransfers: state.activeTransfers.map((transfer) => ({ ...transfer })),
    field: [...state.field],
    lane: state.lane.map((slot) => ({ ...slot })),
  };
}

function getMotionProfile(config: SimulationConfig): MotionProfile {
  const normalizedSpeed = Math.min(2, Math.max(0.45, config.baseSpeed));
  const manualInterval = 320 - (normalizedSpeed - 0.45) * 120;
  const bpmInterval =
    config.beatSyncEnabled && config.effectiveBpm
      ? Math.min(
          420,
          Math.max(
            100,
            60000 /
              config.effectiveBpm /
              (normalizedSpeed > 1.35 ? 2 : 1) /
              Math.max(0.8, normalizedSpeed),
          ),
        )
      : manualInterval;
  const moveIntervalMs = Math.round(Math.max(85, Math.min(360, bpmInterval)));

  return {
    dualMoveChance:
      normalizedSpeed > 1.15
        ? Math.min(
            0.33,
            0.08 +
              (normalizedSpeed - 1.1) * 0.14 +
              (config.beatSyncEnabled ? config.energyLevel * 0.12 : 0),
          )
        : 0,
    flashMs: 190,
    moveIntervalMs,
    readingMs: Math.round(Math.max(70, moveIntervalMs * 0.52)),
    verifyStepMs: Math.round(Math.max(10, Math.min(28, moveIntervalMs * 0.14))),
    writingMs: Math.round(Math.max(45, moveIntervalMs * 0.26)),
  };
}

function getReservedLaneIndexes(state: SimulationState): Set<number> {
  return new Set(state.activeTransfers.map((transfer) => transfer.laneIndex));
}

function findNextLaneIndex(state: SimulationState): number | null {
  const reserved = getReservedLaneIndexes(state);
  for (let index = 0; index < state.lane.length; index += 1) {
    if (reserved.has(index)) {
      continue;
    }
    if (state.lane[index].state === 'unused') {
      return index;
    }
  }
  return null;
}

export function selectRandomUsedSource(
  field: SectorState[],
  excludedIndexes: Set<number>,
  random: RandomSource,
): number | null {
  const candidates: number[] = [];
  for (let index = 0; index < field.length; index += 1) {
    if (field[index] === 'used' && !excludedIndexes.has(index)) {
      candidates.push(index);
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  return candidates[Math.floor(random() * candidates.length)];
}

function shouldLaunchSecondMover(
  config: SimulationConfig,
  profile: MotionProfile,
  random: RandomSource,
): boolean {
  return config.beatSyncEnabled && random() < profile.dualMoveChance;
}

function launchTransfers(
  state: SimulationState,
  config: SimulationConfig,
  profile: MotionProfile,
  random: RandomSource,
): number {
  const reservedSources = new Set(state.activeTransfers.map((transfer) => transfer.sourceIndex));
  const reservedLanes = getReservedLaneIndexes(state);
  const maxLaunches =
    reservedLanes.size < state.columns && shouldLaunchSecondMover(config, profile, random)
      ? 2
      : 1;
  let launched = 0;

  while (launched < maxLaunches) {
    const laneIndex = findNextLaneIndex(state);
    if (laneIndex === null) {
      break;
    }

    const sourceIndex = selectRandomUsedSource(state.field, reservedSources, random);
    if (sourceIndex === null) {
      break;
    }

    state.field[sourceIndex] = 'reading';
    state.activeTransfers.push({
      laneIndex,
      phase: 'reading',
      remainingMs: profile.readingMs,
      sourceIndex,
    });
    reservedSources.add(sourceIndex);
    launched += 1;
  }

  return launched;
}

function isLaneFull(state: SimulationState): boolean {
  return state.lane.every((slot) => slot.state === 'used');
}

function startCompletion(profile: MotionProfile): CompletionState {
  return {
    phase: 'flash',
    remainingMs: profile.flashMs,
    verifyIndex: -1,
  };
}

function softReshuffleField(
  field: SectorState[],
  columns: number,
  random: RandomSource,
  boardConfig: SimulationBoardConfig,
): SectorState[] {
  const next = [...field];
  for (let index = 0; index < next.length; index += 1) {
    const current = next[index];
    const mutationRate =
      current === 'bad' || current === 'unmovable'
        ? boardConfig.reshuffleProtectedMutationRate
        : boardConfig.reshuffleMutationRate;
    if (random() > mutationRate) {
      continue;
    }
    next[index] = sampleFieldState(random, boardConfig);
  }

  const minimumUsed = Math.max(
    columns,
    Math.floor(next.length * boardConfig.minimumFieldUsedRatio),
  );
  let usedCount = next.filter((cell) => cell === 'used').length;
  if (usedCount < minimumUsed) {
    for (let index = 0; index < next.length && usedCount < minimumUsed; index += 1) {
      if (
        next[index] === 'unused' &&
        random() < boardConfig.reshuffleUsedTopUpChance
      ) {
        next[index] = 'used';
        usedCount += 1;
      }
    }
  }

  return next;
}

function finishCompletedRow(
  state: SimulationState,
  profile: MotionProfile,
  random: RandomSource,
  boardConfig: SimulationBoardConfig,
): SimulationState {
  state.lane = createLane(state.columns, random, boardConfig);
  state.totalClearedRows += 1;
  state.field = softReshuffleField(state.field, state.columns, random, boardConfig);
  state.clusterNumber = createClusterNumber(random);
  if (state.totalClearedRows % state.rowsPerPass === 0) {
    state.passNumber += 1;
  }
  state.pendingMoveMs = profile.moveIntervalMs * 0.5;
  return state;
}

function processTransfers(
  state: SimulationState,
  profile: MotionProfile,
  deltaMs: number,
): void {
  const nextTransfers: ActiveTransfer[] = [];
  for (const transfer of state.activeTransfers) {
    const remainingMs = transfer.remainingMs - deltaMs;
    if (remainingMs > 0) {
      nextTransfers.push({ ...transfer, remainingMs });
      continue;
    }

    if (transfer.phase === 'reading') {
      state.field[transfer.sourceIndex] = 'unused';
      state.lane[transfer.laneIndex] = { state: 'writing' };
      nextTransfers.push({
        ...transfer,
        phase: 'writing',
        remainingMs: profile.writingMs,
      });
      continue;
    }

    state.lane[transfer.laneIndex] = { state: 'used' };
  }

  state.activeTransfers = nextTransfers;
}

function processCompletion(
  state: SimulationState,
  profile: MotionProfile,
  boardConfig: SimulationBoardConfig,
  deltaMs: number,
  random: RandomSource,
): void {
  if (!state.completion) {
    return;
  }

  let remaining = state.completion.remainingMs - deltaMs;
  let completion = state.completion;

  while (remaining <= 0 && completion) {
    if (completion.phase === 'flash') {
      completion = {
        phase: 'verify',
        remainingMs: profile.verifyStepMs,
        verifyIndex: 0,
      };
      remaining += profile.verifyStepMs;
      continue;
    }

    if (completion.verifyIndex >= state.columns - 1) {
      finishCompletedRow(state, profile, random, boardConfig);
      state.completion = null;
      return;
    }

    completion = {
      phase: 'verify',
      remainingMs: profile.verifyStepMs,
      verifyIndex: completion.verifyIndex + 1,
    };
    remaining += profile.verifyStepMs;
  }

  state.completion = completion
    ? {
        ...completion,
        remainingMs: remaining,
      }
    : null;
}

export function createSimulationState(
  config: SimulationConfig,
  random: RandomSource = Math.random,
): SimulationState {
  const boardConfig = getBoardConfig(config);
  return {
    activeTransfers: [],
    clusterNumber: createClusterNumber(random),
    columns: config.columns,
    completion: null,
    elapsedMs: 0,
    field: createField(config.columns, config.fieldRows, random, boardConfig),
    fieldRows: config.fieldRows,
    lane: createLane(config.columns, random, boardConfig),
    passNumber: 1,
    pendingMoveMs: 0,
    rowsPerPass: config.rowsPerPass,
    totalClearedRows: 0,
  };
}

export function getRowsCompletedInPass(state: SimulationState): number {
  return state.totalClearedRows % state.rowsPerPass;
}

export function getLaneVisualState(
  state: SimulationState,
  laneIndex: number,
): LaneVisualState {
  if (state.completion?.phase === 'flash') {
    return 'highlight';
  }

  if (
    state.completion?.phase === 'verify' &&
    laneIndex <= state.completion.verifyIndex
  ) {
    return 'highlight';
  }

  const laneState = state.lane[laneIndex]?.state ?? 'unused';
  if (laneState === 'used') {
    return 'lane-used';
  }
  if (laneState === 'writing') {
    return 'lane-writing';
  }

  return 'unused';
}

export function advanceSimulation(
  currentState: SimulationState,
  config: SimulationConfig,
  deltaMs: number,
  random: RandomSource = Math.random,
): SimulationTickResult {
  if (
    currentState.columns !== config.columns ||
    currentState.fieldRows !== config.fieldRows
  ) {
    return {
      launchedTransfers: 0,
      state: createSimulationState(config, random),
    };
  }

  const state = cloneState(currentState);
  const profile = getMotionProfile(config);
  const boardConfig = getBoardConfig(config);

  state.elapsedMs += deltaMs;
  state.pendingMoveMs -= deltaMs;

  processTransfers(state, profile, deltaMs);
  processCompletion(state, profile, boardConfig, deltaMs, random);

  let launchedTransfers = 0;

  if (!state.completion && isLaneFull(state) && state.activeTransfers.length === 0) {
    state.completion = startCompletion(profile);
  }

  if (!state.completion) {
    while (state.pendingMoveMs <= 0) {
      const launched = launchTransfers(state, config, profile, random);
      launchedTransfers += launched;
      state.pendingMoveMs += profile.moveIntervalMs;

      if (launched === 0) {
        state.field = softReshuffleField(
          state.field,
          state.columns,
          random,
          boardConfig,
        );
        break;
      }
    }
  }

  return {
    launchedTransfers,
    state,
  };
}
