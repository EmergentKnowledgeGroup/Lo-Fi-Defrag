import { constants as fsConstants } from 'node:fs';
import { access, readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { parseFile } from 'music-metadata';

import { createTrackId, isSupportedAudioPath, trackTitleFromPath } from '../shared/media';
import type { PlaylistItem } from '../shared/types';

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function walkDirectory(rootPath: string): Promise<string[]> {
  const entries = await readdir(rootPath, { withFileTypes: true });
  const audioFiles = await Promise.all(
    entries.map(async (entry) => {
      const resolvedPath = path.join(rootPath, entry.name);
      if (entry.isDirectory()) {
        return walkDirectory(resolvedPath);
      }
      return isSupportedAudioPath(resolvedPath) ? [resolvedPath] : [];
    }),
  );
  return audioFiles.flat().sort((left, right) => left.localeCompare(right));
}

async function buildPlaylistItem(filePath: string): Promise<PlaylistItem> {
  let title = trackTitleFromPath(filePath);
  let artist: string | null = null;
  let album: string | null = null;
  let duration: number | null = null;

  try {
    const metadata = await parseFile(filePath, { duration: true });
    title = metadata.common.title?.trim() || title;
    artist = metadata.common.artist?.trim() || null;
    album = metadata.common.album?.trim() || null;
    duration =
      typeof metadata.format.duration === 'number'
        ? Math.max(0, metadata.format.duration)
        : null;
  } catch {
    // Metadata is optional; filename fallback is intentional.
  }

  return {
    album,
    artist,
    bpm: null,
    duration,
    id: createTrackId(filePath),
    missing: false,
    path: filePath,
    sourceUrl: pathToFileURL(filePath).toString(),
    title,
  };
}

export async function collectAudioFiles(
  selections: string[],
  mode: 'files' | 'folder',
): Promise<string[]> {
  if (mode === 'folder') {
    const directories = await Promise.all(selections.map((selection) => walkDirectory(selection)));
    return directories.flat();
  }

  return selections.filter((selection) => isSupportedAudioPath(selection));
}

export async function importPlaylistItems(filePaths: string[]): Promise<PlaylistItem[]> {
  const uniquePaths = Array.from(new Set(filePaths));
  const tracks = await Promise.all(uniquePaths.map((filePath) => buildPlaylistItem(filePath)));
  return tracks.sort((left, right) => left.title.localeCompare(right.title));
}

export async function hydratePlaylistItems(
  items: PlaylistItem[],
): Promise<PlaylistItem[]> {
  const hydrated = await Promise.all(
    items.map(async (item) => {
      const fileExists = await exists(item.path);
      return {
        ...item,
        id: createTrackId(item.path),
        missing: !fileExists,
        sourceUrl: fileExists ? pathToFileURL(item.path).toString() : '',
      };
    }),
  );

  return hydrated;
}
