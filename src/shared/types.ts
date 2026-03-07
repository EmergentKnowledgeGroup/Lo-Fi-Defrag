export const VALID_SKIN_IDS = [
  'classic-ms',
  'crt-lounge',
  'studio-modern',
] as const;

export type SkinId = (typeof VALID_SKIN_IDS)[number];
export type RepeatMode = 'off' | 'one' | 'all';
export type SectorState =
  | 'unused'
  | 'used'
  | 'reading'
  | 'writing'
  | 'bad'
  | 'unmovable';

export interface PlaylistItem {
  album: string | null;
  artist: string | null;
  bpm: number | null;
  duration: number | null;
  id: string;
  missing: boolean;
  path: string;
  sourceUrl: string;
  title: string;
}

export interface PersistedAppState {
  beatSyncEnabled: boolean;
  currentTrackId: string | null;
  isMuted: boolean;
  lastSavedAt: string;
  manualBpm: number | null;
  playbackPosition: number;
  playlist: PlaylistItem[];
  repeatMode: RepeatMode;
  shouldResumePlayback: boolean;
  skinId: SkinId;
  speed: number;
  volume: number;
}

export interface ImportAudioPayload {
  mode: 'files' | 'folder';
}

export interface ImportResult {
  sourceLabel: string;
  tracks: PlaylistItem[];
}

export interface LaneSlot {
  state: 'unused' | 'used' | 'writing';
}

export interface ActiveTransfer {
  laneIndex: number;
  phase: 'reading' | 'writing';
  remainingMs: number;
  sourceIndex: number;
}

export interface CompletionState {
  phase: 'flash' | 'verify';
  remainingMs: number;
  verifyIndex: number;
}

export interface SimulationBoardConfig {
  fieldBadRatio: number;
  fieldUnmovableRatio: number;
  fieldUsedRatio: number;
  laneSeedUsedRatio: number;
  minimumFieldUsedRatio: number;
  reshuffleMutationRate: number;
  reshuffleProtectedMutationRate: number;
  reshuffleUsedTopUpChance: number;
}

export interface SimulationConfig {
  baseSpeed: number;
  beatSyncEnabled: boolean;
  boardConfig?: SimulationBoardConfig;
  columns: number;
  effectiveBpm: number | null;
  energyLevel: number;
  fieldRows: number;
  rowsPerPass: number;
}

export interface SimulationState {
  activeTransfers: ActiveTransfer[];
  clusterNumber: number;
  columns: number;
  completion: CompletionState | null;
  elapsedMs: number;
  field: SectorState[];
  fieldRows: number;
  lane: LaneSlot[];
  passNumber: number;
  pendingMoveMs: number;
  rowsPerPass: number;
  totalClearedRows: number;
}

export interface SimulationTickResult {
  launchedTransfers: number;
  state: SimulationState;
}

export interface DesktopApi {
  getFullscreenState(): Promise<boolean>;
  importAudio(payload: ImportAudioPayload): Promise<ImportResult>;
  loadSession(): Promise<PersistedAppState>;
  onFullscreenChanged(listener: (isFullscreen: boolean) => void): () => void;
  saveSession(state: PersistedAppState): Promise<void>;
  toggleFullscreen(): Promise<boolean>;
}
