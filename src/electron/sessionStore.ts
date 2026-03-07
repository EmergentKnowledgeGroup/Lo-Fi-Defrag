import { mkdir, open, readFile, rename, unlink } from 'node:fs/promises';
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
  const tempPath = `${sessionPath}.tmp`;
  const contents = JSON.stringify(sanitized, null, 2);
  await mkdir(path.dirname(sessionPath), { recursive: true });
  let fileHandle: Awaited<ReturnType<typeof open>> | null = null;

  try {
    fileHandle = await open(tempPath, 'w');
    await fileHandle.writeFile(contents, 'utf8');
    await fileHandle.sync();
    await fileHandle.close();
    fileHandle = null;
    await rename(tempPath, sessionPath);
  } catch (error) {
    await fileHandle?.close().catch(() => undefined);
    await unlink(tempPath).catch(() => undefined);
    throw error;
  }
}
