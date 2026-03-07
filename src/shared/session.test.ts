import { describe, expect, it } from 'vitest';

import { DEFAULT_SESSION_STATE, sanitizeSession } from './session';

describe('sanitizeSession', () => {
  it('returns defaults for invalid payloads', () => {
    const {
      lastSavedAt: ignoredLastSavedAt,
      ...expectedDefaults
    } = DEFAULT_SESSION_STATE;
    const result = sanitizeSession(null);

    expect(ignoredLastSavedAt).toBeTypeOf('string');
    expect(result).toEqual(expect.objectContaining(expectedDefaults));
    expect(Number.isNaN(Date.parse(result.lastSavedAt))).toBe(false);
  });

  it('drops invalid tracks and clamps persisted values', () => {
    const state = sanitizeSession({
      beatSyncEnabled: false,
      currentTrackId: '/music/ok.mp3',
      isMuted: true,
      manualBpm: 204,
      playbackPosition: -17,
      playlist: [
        { id: '/music/ok.mp3', path: '/music/ok.mp3', title: 'Okay' },
        { title: 'Broken entry' },
      ],
      repeatMode: 'one',
      shouldResumePlayback: true,
      skinId: 'crt-lounge',
      speed: 4,
      volume: 2,
    });

    expect(state.playlist).toHaveLength(1);
    expect(state.currentTrackId).toBe('/music/ok.mp3');
    expect(state.manualBpm).toBe(160);
    expect(state.playbackPosition).toBe(0);
    expect(state.speed).toBe(2);
    expect(state.volume).toBe(1);
    expect(state.repeatMode).toBe('one');
    expect(state.skinId).toBe('crt-lounge');
  });
});
