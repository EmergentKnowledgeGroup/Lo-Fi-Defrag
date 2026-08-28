# Lo-fi Defragger

[Watch the demo: Lo-Fi Defrag.mp4 (31 seconds, 21.7 MB)](./Lo-Fi%20Defrag.mp4)

Lo-fi Defragger is a local-first desktop music player and ambient visualizer. It turns your own music library into a looping, MS-DOS-inspired disk-defragmentation simulation.

The app does not scan your whole disk or modify source audio files. It reads files and folders that you explicitly select and stores local playlist state.

## Quick start

Prerequisite: Node.js 22 LTS and npm.

```bash
git clone https://github.com/EmergentKnowledgeGroup/Lo-Fi-Defrag.git
cd Lo-Fi-Defrag
npm ci
npm run dev
```

When the app opens, select `Playlist`, then use `Import` to choose files or `Folder` to add a directory. Choose a track to play it; the board animates with the audio. `Test` runs the visualizer without music.

## What you can do

- Import individual local files or scan a music folder.
- Play, pause, seek, change volume, mute, repeat, and reorder tracks.
- Keep a playlist between launches; missing source files are marked instead of crashing the app.
- Use beat-aware motion when a tempo can be estimated, or set the simulation speed yourself.
- Switch between Classic MS and CRT Lounge visuals.

The file picker accepts `.aac`, `.aif`, `.aiff`, `.flac`, `.m4a`, `.mp3`, `.mp4`, `.ogg`, `.opus`, `.wav`, and `.webm`. Actual playback support is provided by Electron's bundled Chromium, so codec support can vary by platform and file encoding.

## Run and verify

| Task | Command |
| --- | --- |
| Start the app in development | `npm run dev` |
| Run tests | `npm run test` |
| Type-check | `npm run typecheck` |
| Lint | `npm run lint` |
| Package the current platform | `npm run build` |
| Make a Windows installer | `npm run make:win` |
| Make Linux packages | `npm run make:linux` |
| Make a macOS ZIP | `npm run make:mac` |

Run platform-specific packaging on that platform. The Windows helper script, `build-windows.bat`, runs `npm ci` followed by `npm run make:win`.

## Install or build a package

There is currently no signed, prebuilt release. To use the app today, run it from source with `npm run dev` or create an installer/package locally. The Windows GitHub Actions workflow can also build Windows artifacts on demand; see [DISTRIBUTION.md](DISTRIBUTION.md) for outputs, release notes, and troubleshooting.

## Soundtrack status

The repository intentionally does not include music files yet. Bring your own local tracks while the curated Lo-fi Defragger soundtrack is being finalized. See [TRACKLIST.md](TRACKLIST.md) for the current policy and how to contribute music safely.

## Project docs

- [Technical guide](TECHNICAL.md): architecture, local data handling, and test surface.
- [Distribution guide](DISTRIBUTION.md): build artifacts and release workflow.
- [Soundtrack notes](TRACKLIST.md): current music status and contribution guidance.
- [MIT License](LICENSE)

## Contributing

Fork the repository, make a focused change, run `npm run typecheck`, `npm run lint`, and `npm run test`, then open a pull request. Please do not commit private music libraries, personal playlists, generated installers, or `out/` build artifacts.
