# Technical Documentation

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Electron 40 |
| UI | React 19 + TypeScript |
| Build | Vite 5 + Electron Forge |
| Audio | Web Audio API + music-metadata |
| Testing | Vitest + Testing Library |
| Linting | ESLint + TypeScript ESLint |

## Architecture

```
src/
├── main.ts                          # Electron main process entry
├── preload.ts                       # Preload bridge (IPC)
├── renderer.tsx                     # React mount point
├── index.css                        # Global styles, DOS font, CRT aesthetics
├── app/
│   ├── App.tsx                      # Root component, layout orchestration
│   ├── skins.ts                     # Visual skin definitions
│   ├── formatters.ts                # Display formatting utilities
│   ├── audio/
│   │   └── tempo.ts                 # BPM detection and beat-sync logic
│   ├── components/
│   │   ├── VisualizationBoard.tsx   # The defrag grid — core visual surface
│   │   ├── StatusPanel.tsx          # Cluster counter, elapsed time, pass info
│   │   ├── TransportPanel.tsx       # Play/pause/prev/next, volume, seek
│   │   ├── PlaylistPanel.tsx        # Playlist display and track selection
│   │   ├── PlaylistLauncherPanel.tsx# Import/folder loading UI
│   │   ├── AsciiBar.tsx             # Reusable ASCII-styled progress bar
│   │   ├── HelpOverlay.tsx          # F1 help overlay
│   │   └── OverlayWindow.tsx        # Generic overlay container
│   ├── config/
│   │   └── overlayPanels.ts         # Overlay/panel configuration
│   ├── hooks/
│   │   ├── useAudioPlayer.ts        # Audio playback state and controls
│   │   └── useSimulation.ts         # Defrag simulation loop and state
│   ├── simulation/
│   │   └── engine.ts                # Core simulation engine (sector states, passes, optimization logic)
│   ├── state/
│   │   └── playlist.ts              # Playlist state management
│   └── shared/                      # Shared types and utilities
├── electron/                        # Electron-specific IPC handlers
├── assets/                          # Static assets (fonts, icons)
└── test/                            # Test setup and utilities
```

## Simulation Engine

The defrag simulation (`src/app/simulation/engine.ts`) manages a grid of sector cells, each with a state:

| State | Display | Color |
|-------|---------|-------|
| Used | `██` | Bright white |
| Reading | `██` | Green |
| Writing | `██` | Magenta/Yellow |
| Bad | `B` | Red |
| Unused | ` ` | Blue background (empty) |
| Unmovable | `X` | Dark gray/brown |
| Optimized | `██` | White (packed left) |

The engine runs continuous "passes" that simulate disk optimization — reading clusters, relocating blocks toward the left (consolidated) side of the grid, and marking sectors as optimized. The animation cadence is driven by either a fixed speed multiplier or synced to detected BPM from audio playback.

### Beat Sync

BPM detection (`src/app/audio/tempo.ts`) analyzes the playing audio and provides tempo data to the simulation hook. When sync is enabled, block movement timing aligns to beat subdivisions. Manual speed override is always available.

## Rendering Approach

The visualization grid is rendered as a `<pre>` block of Unicode block characters, not a CSS grid of DOM elements. This is critical for the authentic DOS look:

- Each cell is rendered as colored `<span>` elements containing `██` (two full-block characters for square aspect ratio)
- Font: Perfect DOS VGA 437 (bitmap DOS font, loaded via `@font-face`)
- No antialiasing: `-webkit-font-smoothing: none; font-smooth: never`
- Virtual resolution rendering: the app renders at a fixed internal resolution and scales up using CSS `transform: scale()` with `image-rendering: pixelated` for nearest-neighbor interpolation
- Line height matches font size exactly (`line-height: 1`) — no gaps between rows
- Grid dimensions are computed dynamically to fill available space

## Audio System

Local file playback via Web Audio API with `music-metadata` for tag extraction.

- Supported formats: MP3, FLAC, OGG, WAV, M4A, AAC (anything Chromium decodes)
- Playlist management: import individual files or entire folders
- Transport: play, pause, prev, next, seek, volume, mute
- Repeat modes: off, single track, all
- Playback state drives simulation: paused audio = idle grid

## Skins

Visual skins (`src/app/skins.ts`) define color palettes and rendering parameters. The simulation engine and audio system are skin-agnostic — skins only affect the visual layer.

Current skins:
- **Classic MS** — The flagship. Authentic MS-DOS 6.22 defrag colors and layout.

Additional skins can be added by defining a new skin configuration object.

## Development

```bash
# Install dependencies
npm ci

# Start dev server with hot reload
npm run dev

# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint
```

## Building for Distribution

### Windows

```bash
# Via batch script
build-windows.bat

# Via npm
npm run make:win
```

Output: `out/make/squirrel.windows/x64/` containing `.exe` installer, `RELEASES` file, and `.nupkg` packages.

### macOS / Linux

```bash
python3 launch.py
```

The launcher script detects the platform, checks for an existing packaged build, and either launches it or falls back to `npm run dev`.

Options:
- `--dry-run` — Show what would happen without executing
- `--source` — Force dev mode
- `--install` — Force fresh install

### GitHub CI

Windows EXE builds can be triggered via the workflow at `.github/workflows/windows-exe.yml`.

## Bundled Soundtrack

The app ships with 10 original lo-fi tracks in the `runtime/` directory (or `assets/music/` depending on build). See [TRACKLIST.md](TRACKLIST.md) for the full track listing, genres, BPMs, and liner notes.

Tracks are loaded automatically on first launch if no other playlist is configured.

## License

MIT
