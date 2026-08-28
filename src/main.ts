import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import type { FileFilter } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

import { collectAudioFiles, importPlaylistItems } from './electron/library';
import { loadSessionState, saveSessionState } from './electron/sessionStore';
import { IPC_CHANNELS } from './shared/ipc';
import type { ImportAudioPayload, PersistedAppState } from './shared/types';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let mainWindow: BrowserWindow | null = null;
const DOS_ASPECT_RATIO = 720 / 500;

const AUDIO_FILTERS: FileFilter[] = [
  {
    extensions: ['aac', 'aif', 'aiff', 'flac', 'm4a', 'mp3', 'mp4', 'ogg', 'opus', 'wav', 'webm'],
    name: 'Audio',
  },
];

const createWindow = () => {
  mainWindow = new BrowserWindow({
    useContentSize: true,
    width: 1440,
    height: 1000,
    minHeight: 750,
    minWidth: 1080,
    autoHideMenuBar: true,
    backgroundColor: '#4c5cf2',
    show: false,
    title: 'Lo-fi Defragger',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
    },
  });

  mainWindow.setAspectRatio(DOS_ASPECT_RATIO);

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  const emitFullscreenState = () => {
    mainWindow?.webContents.send(
      IPC_CHANNELS.fullscreenChanged,
      Boolean(mainWindow?.isFullScreen()),
    );
  };

  mainWindow.on('enter-full-screen', emitFullscreenState);
  mainWindow.on('leave-full-screen', emitFullscreenState);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
};

function registerIpcHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.importAudio,
    async (_event, payload: ImportAudioPayload) => {
      const properties: Electron.OpenDialogOptions['properties'] =
        payload.mode === 'folder'
          ? ['openDirectory']
          : ['openFile', 'multiSelections'];
      const dialogOptions = {
        filters: payload.mode === 'folder' ? undefined : AUDIO_FILTERS,
        properties,
        title:
          payload.mode === 'folder'
            ? 'Choose a folder to add to Lo-fi Defragger'
            : 'Choose audio files to add to Lo-fi Defragger',
      };
      const result = mainWindow
        ? await dialog.showOpenDialog(mainWindow, dialogOptions)
        : await dialog.showOpenDialog(dialogOptions);

      if (result.canceled || result.filePaths.length === 0) {
        return { sourceLabel: '', tracks: [] };
      }

      const audioFiles = await collectAudioFiles(result.filePaths, payload.mode);
      const tracks = await importPlaylistItems(audioFiles);
      return {
        sourceLabel: result.filePaths[0],
        tracks,
      };
    },
  );
  ipcMain.handle(IPC_CHANNELS.loadSession, async () => loadSessionState());
  ipcMain.handle(
    IPC_CHANNELS.saveSession,
    async (_event, state: PersistedAppState) => saveSessionState(state),
  );
  ipcMain.handle(IPC_CHANNELS.toggleFullscreen, async () => {
    if (!mainWindow) {
      return false;
    }
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
    return mainWindow.isFullScreen();
  });
  ipcMain.handle(
    IPC_CHANNELS.getFullscreenState,
    async () => Boolean(mainWindow?.isFullScreen()),
  );
}

app.on('ready', () => {
  registerIpcHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
