export const IPC_CHANNELS = {
  fullscreenChanged: 'window:fullscreen-changed',
  getFullscreenState: 'window:get-fullscreen-state',
  importAudio: 'library:import-audio',
  loadSession: 'session:load',
  saveSession: 'session:save',
  toggleFullscreen: 'window:toggle-fullscreen',
} as const;
