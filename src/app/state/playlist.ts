import type { PlaylistItem, RepeatMode } from '../../shared/types';

export function findTrackIndex(
  playlist: PlaylistItem[],
  trackId: string | null,
): number {
  if (!trackId) {
    return -1;
  }

  return playlist.findIndex((track) => track.id === trackId);
}

export function mergeImportedTracks(
  existing: PlaylistItem[],
  imported: PlaylistItem[],
): PlaylistItem[] {
  const byId = new Map(existing.map((track) => [track.id, track]));
  const merged = [...existing];

  for (const track of imported) {
    const current = byId.get(track.id);
    if (!current) {
      merged.push(track);
      byId.set(track.id, track);
      continue;
    }

    byId.set(track.id, {
      ...current,
      ...track,
      missing: false,
    });
  }

  return merged.map((track) => byId.get(track.id) ?? track);
}

export function movePlaylistItem(
  playlist: PlaylistItem[],
  fromIndex: number,
  toIndex: number,
): PlaylistItem[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= playlist.length ||
    toIndex >= playlist.length
  ) {
    return playlist;
  }

  const next = [...playlist];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function removePlaylistItem(
  playlist: PlaylistItem[],
  trackId: string,
): PlaylistItem[] {
  return playlist.filter((track) => track.id !== trackId);
}

export function findNextPlayableTrackId(
  playlist: PlaylistItem[],
  currentTrackId: string | null,
  repeatMode: RepeatMode,
): string | null {
  if (playlist.length === 0) {
    return null;
  }

  const currentIndex = findTrackIndex(playlist, currentTrackId);
  const startIndex = currentIndex >= 0 ? currentIndex + 1 : 0;
  for (let index = startIndex; index < playlist.length; index += 1) {
    if (!playlist[index].missing) {
      return playlist[index].id;
    }
  }

  if (repeatMode === 'all') {
    for (let index = 0; index < Math.max(0, startIndex); index += 1) {
      if (!playlist[index].missing) {
        return playlist[index].id;
      }
    }
  }

  return repeatMode === 'one' && currentTrackId ? currentTrackId : null;
}

export function findPreviousPlayableTrackId(
  playlist: PlaylistItem[],
  currentTrackId: string | null,
): string | null {
  if (playlist.length === 0) {
    return null;
  }

  const currentIndex = findTrackIndex(playlist, currentTrackId);
  const startIndex = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;

  for (let steps = 0; steps < playlist.length; steps += 1) {
    const index = (startIndex - steps + playlist.length) % playlist.length;
    if (!playlist[index].missing) {
      return playlist[index].id;
    }
  }

  return null;
}

export function findFirstPlayableTrackId(playlist: PlaylistItem[]): string | null {
  return playlist.find((track) => !track.missing)?.id ?? null;
}

export function getImportedTrackSelection(
  existing: PlaylistItem[],
  imported: PlaylistItem[],
  currentTrackId: string | null,
  mode: 'files' | 'folder',
): string | null {
  const importedPlayableTrackId = findFirstPlayableTrackId(imported);
  if (!importedPlayableTrackId) {
    return null;
  }

  if (mode === 'files') {
    return importedPlayableTrackId;
  }

  const currentTrack =
    currentTrackId !== null
      ? existing.find((track) => track.id === currentTrackId) ?? null
      : null;

  if (!currentTrack || currentTrack.missing) {
    return importedPlayableTrackId;
  }

  return null;
}
