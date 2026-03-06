import type { SkinId } from '../shared/types';

export interface SkinDefinition {
  description: string;
  id: SkinId;
  label: string;
  tone: string;
}

export const SKINS: SkinDefinition[] = [
  {
    description: 'Closest to the Windows-era optimize utility with bright cobalt, amber highlights, and crisp mono framing.',
    id: 'classic-ms',
    label: 'Classic MS',
    tone: 'Faithful retro utility',
  },
  {
    description: 'CRT bloom, darker phosphor tones, and warmer pulses for a moodier late-night ambience.',
    id: 'crt-lounge',
    label: 'CRT Lounge',
    tone: 'Retro lofi lounge',
  },
  {
    description: 'A more editorial desk setup: parchment panels, high-contrast accents, and cleaner spacing.',
    id: 'studio-modern',
    label: 'Studio Modern',
    tone: 'Modern homage',
  },
];

export function getSkin(id: SkinId): SkinDefinition {
  return SKINS.find((skin) => skin.id === id) ?? SKINS[0];
}
