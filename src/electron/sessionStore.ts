import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { app } from 'electron';

import { DEFAULT_SESSION_STATE, sanitizeSession } from '../shared/session';
import type { PersistedAppState } from '../shared/types';
import { hydratePlaylistItems } from './library';

function getSessionPath(): string {
  return path.join(app.getPath('userData'), 'session.json');
}

export async function loadSessionState(): Promise<PersistedAppState> {
  try {
    const sessionFile = await readFile(getSessionPath(), 'utf8');
    const parsed = JSON.parse(sessionFile);
    const sanitized = sanitizeSession(parsed);
    const playlist = await hydratePlaylistItems(sanitized.playlist);
    const currentTrackId = playlist.some((track) => track.id === sanitized.currentTrackId)
      ? sanitized.currentTrackId
      : playlist[0]?.id ?? null;

    return {
      ...sanitized,
      currentTrackId,
      playlist,
    };
  } catch {
    return { ...DEFAULT_SESSION_STATE };
  }
}

export async function saveSessionState(
  incomingState: PersistedAppState,
): Promise<void> {
  const sanitized = sanitizeSession({
    ...incomingState,
    lastSavedAt: new Date().toISOString(),
  });
  const sessionPath = getSessionPath();
  await mkdir(path.dirname(sessionPath), { recursive: true });
  await writeFile(sessionPath, JSON.stringify(sanitized, null, 2), 'utf8');
}
