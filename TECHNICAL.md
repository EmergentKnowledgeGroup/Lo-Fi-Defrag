# Technical Guide

## Stack

| Layer | Technology |
| --- | --- |
| Desktop runtime | Electron 40 |
| Renderer | React 19 and TypeScript |
| Build | Vite 5 and Electron Forge |
| Metadata | `music-metadata` |
| Tests | Vitest and Testing Library |

## Architecture

```text
src/
  main.ts                 Electron window and IPC registration
  preload.ts              Narrow renderer-to-main bridge
  electron/
    library.ts            Local file discovery and metadata extraction
    sessionStore.ts       Atomic persistent session storage
  app/
    App.tsx               Renderer composition and overlay ownership
    hooks/useAudioPlayer  Playback, analysis, playlist persistence
    simulation/engine.ts  Defrag-style animation state machine
    components/           Player, playlist, overlays, and grid UI
  shared/                 IPC contracts, session types, media helpers
```

The renderer has no Node.js integration. The Electron window uses context isolation and sandboxing; only the APIs exposed by `src/preload.ts` are available to the UI.

## Local music and playlists

`src/main.ts` opens the native file or folder picker. `src/electron/library.ts` filters supported extensions, skips symbolic links, avoids directory cycles, ignores unreadable folders, and reads metadata with bounded concurrency. Metadata failure falls back to a filename-derived title, so one malformed file does not abort the import.

The app remembers playlist entries, selected track, position, volume, repeat mode, skin, and simulation preferences in Electron's `userData` directory. It stores only paths and metadata; the source audio files remain where the user keeps them. On the next launch, missing paths are retained and marked as unavailable.

## Audio analysis and simulation

The renderer uses an HTML audio element for playback and a Web Audio `AnalyserNode` for frequency energy. Peak intervals can produce a best-effort BPM estimate. The simulation does not modify any disk data: it animates a grid of sector states in `src/app/simulation/engine.ts` and can run from either music energy or manual test mode.

The board is a CSS grid rendered at a fixed virtual DOS resolution. The Perfect DOS VGA 437 font and pixel-oriented scaling create the terminal-era presentation without relying on an emulator.

## Development

```bash
npm ci
npm run dev
```

Use these checks before opening a pull request:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm audit --omit=dev
```

`npm run build` packages the current platform. It is the quickest local proof that the main process, preload bridge, and renderer production bundles fit together.

## Tests

The test suite covers playlist state operations, session sanitization, simulation transitions, local-library import behavior, and the reusable ASCII progress bar. Browser-specific audio decoding is exercised manually because it depends on the installed Electron runtime and local media codecs.

## Extending the app

- Add a visual skin in `src/app/skins.ts` and its CSS variables in `src/index.css`.
- Keep new renderer-to-main behavior behind an explicit IPC channel in `src/shared/ipc.ts` and `src/preload.ts`.
- Keep file-system work in the main process; never expose Node.js directly to the renderer.
- Add focused tests alongside changes to playlist, session, import, or simulation behavior.
