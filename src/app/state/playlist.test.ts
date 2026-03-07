import { describe, expect, it } from 'vitest';

import type { PlaylistItem } from '../../shared/types';
import { getImportedTrackSelection } from './playlist';

function createTrack(
  id: string,
  overrides: Partial<PlaylistItem> = {},
): PlaylistItem {
  return {
    album: null,
    artist: null,
    bpm: null,
    duration: 180,
    id,
    missing: false,
    path: id,
    sourceUrl: `file:///${id}`,
    title: id,
    ...overrides,
  };
}

describe('getImportedTrackSelection', () => {
  it('prefers imported files when the user directly imports files', () => {
    const currentTrack = createTrack('current-track');
    const importedTrack = createTrack('imported-track');

    expect(
      getImportedTrackSelection(
        [currentTrack],
        [importedTrack],
        currentTrack.id,
        'files',
      ),
    ).toBe(importedTrack.id);
  });

  it('promotes imported folder tracks when the saved current track is missing', () => {
    const staleTrack = createTrack('stale-track', { missing: true, sourceUrl: '' });
    const importedTrack = createTrack('imported-track');

    expect(
      getImportedTrackSelection(
        [staleTrack],
        [importedTrack],
        staleTrack.id,
        'folder',
      ),
    ).toBe(importedTrack.id);
  });

  it('keeps the current track for folder imports when it is still playable', () => {
    const currentTrack = createTrack('current-track');
    const importedTrack = createTrack('imported-track');

    expect(
      getImportedTrackSelection(
        [currentTrack],
        [importedTrack],
        currentTrack.id,
        'folder',
      ),
    ).toBeNull();
  });
});
