import {
  VALID_SKIN_IDS,
  type PersistedAppState,
  type PlaylistItem,
  type RepeatMode,
  type SkinId,
} from './types';

export const DEFAULT_ROWS_PER_PASS = 12;

export const DEFAULT_SESSION_STATE: PersistedAppState = {
  beatSyncEnabled: true,
  currentTrackId: null,
  lastSavedAt: new Date(0).toISOString(),
  manualBpm: 92,
  playbackPosition: 0,
  playlist: [],
  repeatMode: 'all',
  shouldResumePlayback: false,
  skinId: 'classic-ms',
  speed: 1,
  volume: 0.72,
  isMuted: false,
};

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isRepeatMode(value: unknown): value is RepeatMode {
  return value === 'off' || value === 'one' || value === 'all';
}

function isSkinId(value: unknown): value is SkinId {
  return typeof value === 'string' && VALID_SKIN_IDS.includes(value as SkinId);
}

function sanitizePlaylistItem(item: unknown): PlaylistItem | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const candidate = item as Partial<PlaylistItem>;
  if (!candidate.path || !candidate.title || !candidate.id) {
    return null;
  }

  return {
    album: typeof candidate.album === 'string' ? candidate.album : null,
    artist: typeof candidate.artist === 'string' ? candidate.artist : null,
    bpm: typeof candidate.bpm === 'number' ? candidate.bpm : null,
    duration:
      typeof candidate.duration === 'number' && Number.isFinite(candidate.duration)
        ? candidate.duration
        : null,
    id: candidate.id,
    missing: Boolean(candidate.missing),
    path: candidate.path,
    sourceUrl: typeof candidate.sourceUrl === 'string' ? candidate.sourceUrl : '',
    title: candidate.title,
  };
}

export function sanitizeSession(input: unknown): PersistedAppState {
  if (!input || typeof input !== 'object') {
    return { ...DEFAULT_SESSION_STATE };
  }

  const candidate = input as Partial<PersistedAppState>;
  const playlist = Array.isArray(candidate.playlist)
    ? candidate.playlist
        .map((item) => sanitizePlaylistItem(item))
        .filter((item): item is PlaylistItem => item !== null)
    : [];
  const currentTrackId =
    typeof candidate.currentTrackId === 'string' &&
    playlist.some((item) => item.id === candidate.currentTrackId)
      ? candidate.currentTrackId
      : playlist[0]?.id ?? null;

  return {
    beatSyncEnabled:
      typeof candidate.beatSyncEnabled === 'boolean'
        ? candidate.beatSyncEnabled
        : DEFAULT_SESSION_STATE.beatSyncEnabled,
    currentTrackId,
    isMuted:
      typeof candidate.isMuted === 'boolean'
        ? candidate.isMuted
        : DEFAULT_SESSION_STATE.isMuted,
    lastSavedAt:
      typeof candidate.lastSavedAt === 'string'
        ? candidate.lastSavedAt
        : new Date().toISOString(),
    manualBpm:
      typeof candidate.manualBpm === 'number' && Number.isFinite(candidate.manualBpm)
        ? clampNumber(candidate.manualBpm, 60, 160)
        : DEFAULT_SESSION_STATE.manualBpm,
    playbackPosition:
      typeof candidate.playbackPosition === 'number' &&
      Number.isFinite(candidate.playbackPosition)
        ? Math.max(0, candidate.playbackPosition)
        : DEFAULT_SESSION_STATE.playbackPosition,
    playlist,
    repeatMode: isRepeatMode(candidate.repeatMode)
      ? candidate.repeatMode
      : DEFAULT_SESSION_STATE.repeatMode,
    shouldResumePlayback:
      typeof candidate.shouldResumePlayback === 'boolean'
        ? candidate.shouldResumePlayback
        : DEFAULT_SESSION_STATE.shouldResumePlayback,
    skinId: isSkinId(candidate.skinId)
      ? candidate.skinId
      : DEFAULT_SESSION_STATE.skinId,
    speed:
      typeof candidate.speed === 'number' && Number.isFinite(candidate.speed)
        ? clampNumber(candidate.speed, 0.45, 2)
        : DEFAULT_SESSION_STATE.speed,
    volume:
      typeof candidate.volume === 'number' && Number.isFinite(candidate.volume)
        ? clampNumber(candidate.volume, 0, 1)
        : DEFAULT_SESSION_STATE.volume,
  };
}
