import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { collectAudioFiles, importPlaylistItems } from './library';

describe('library import helpers', () => {
  it('skips unreadable or missing folders instead of rejecting import', async () => {
    const missingDirectory = path.join(
      os.tmpdir(),
      `lofi-defragger-missing-${Date.now()}`,
    );

    await expect(collectAudioFiles([missingDirectory], 'folder')).resolves.toEqual([]);
  });

  it('recursively collects only supported audio files', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'lofi-defragger-'));
    const nested = path.join(root, 'nested');
    await mkdir(nested);
    const trackPath = path.join(root, 'track.mp3');
    const nestedTrackPath = path.join(nested, 'other.WAV');
    const ignoredPath = path.join(root, 'notes.txt');

    await Promise.all([
      writeFile(trackPath, ''),
      writeFile(nestedTrackPath, ''),
      writeFile(ignoredPath, ''),
    ]);

    const audioFiles = await collectAudioFiles([root], 'folder');
    expect(new Set(audioFiles)).toEqual(new Set([nestedTrackPath, trackPath]));
  });

  it('deduplicates playlist imports and falls back to filenames when metadata is unreadable', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'lofi-defragger-'));
    const trackPath = path.join(root, 'my_test-track.mp3');
    await writeFile(trackPath, '');

    const tracks = await importPlaylistItems([trackPath, trackPath]);

    expect(tracks).toHaveLength(1);
    expect(tracks[0]).toMatchObject({
      id: trackPath,
      missing: false,
      path: trackPath,
      title: 'my test track',
    });
    expect(tracks[0].sourceUrl).toMatch(/^file:/);
  });
});
