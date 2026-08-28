import overlayPanelsJson from './overlay-panels.json';

export interface OverlayFrameConfig {
  height: number;
  width: number;
  x: number;
  y: number;
}

interface HelpOverlayItemConfig {
  description: string;
  label: string;
}

interface HelpOverlayConfig {
  footer: string;
  frame: OverlayFrameConfig;
  items: HelpOverlayItemConfig[];
  title: string;
}

interface PlaylistOverlayConfig {
  columns: {
    length: string;
    title: string;
  };
  emptyMessage: string;
  footer: string;
  frame: OverlayFrameConfig;
  title: string;
}

export interface OverlayPanelsConfig {
  help: HelpOverlayConfig;
  playlist: PlaylistOverlayConfig;
}

export const overlayPanels = overlayPanelsJson as OverlayPanelsConfig;
