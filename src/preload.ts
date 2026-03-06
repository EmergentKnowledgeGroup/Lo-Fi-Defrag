import { contextBridge, ipcRenderer } from 'electron';

import { IPC_CHANNELS } from './shared/ipc';
import type { DesktopApi, ImportAudioPayload, PersistedAppState } from './shared/types';

const api: DesktopApi = {
  getFullscreenState: () => ipcRenderer.invoke(IPC_CHANNELS.getFullscreenState),
  importAudio: (payload: ImportAudioPayload) =>
    ipcRenderer.invoke(IPC_CHANNELS.importAudio, payload),
  loadSession: () => ipcRenderer.invoke(IPC_CHANNELS.loadSession),
  onFullscreenChanged: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, value: boolean) => {
      listener(value);
    };
    ipcRenderer.on(IPC_CHANNELS.fullscreenChanged, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.fullscreenChanged, handler);
    };
  },
  saveSession: (state: PersistedAppState) =>
    ipcRenderer.invoke(IPC_CHANNELS.saveSession, state),
  toggleFullscreen: () => ipcRenderer.invoke(IPC_CHANNELS.toggleFullscreen),
};

contextBridge.exposeInMainWorld('lofiDefragger', api);
