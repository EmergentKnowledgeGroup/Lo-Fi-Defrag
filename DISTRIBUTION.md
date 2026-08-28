# Distribution Guide

Lo-fi Defragger is an Electron Forge application. You can run it from source, package it locally, or use the repository's manual Windows build workflow.

## Run from source

Install Node.js 22 LTS, then run:

```bash
npm ci
npm run dev
```

On macOS or Linux, `python3 launch.py` is a convenience launcher. It starts a packaged build when one exists for the current platform; otherwise it installs dependencies when needed and starts development mode.

Useful launcher options:

```bash
python3 launch.py --dry-run
python3 launch.py --source
python3 launch.py --install
```

## Make local packages

Run package commands on the operating system you are targeting.

| Target | Command | Result |
| --- | --- | --- |
| Current platform | `npm run build` | Packaged app under `out/` |
| Windows x64 | `npm run make:win` | Squirrel installer artifacts under `out/make/squirrel.windows/x64/` |
| Linux | `npm run make:linux` | Debian and RPM packages under `out/make/` |
| macOS | `npm run make:mac` | ZIP archive under `out/make/zip/` |

On Windows, double-click `build-windows.bat` to run a clean install followed by `npm run make:win`.

## GitHub Actions Windows build

The `Build Windows EXE` workflow is intentionally manual. In GitHub, open **Actions**, choose **Build Windows EXE**, and select **Run workflow**. It uploads the generated `.exe`, `.nupkg`, and `RELEASES` files as a workflow artifact.

The workflow does not create a GitHub Release or sign the installer. Unsigned Windows builds may trigger SmartScreen. A public release process should add signing credentials and an explicit release-upload step before advertising installer downloads.

## Before publishing a release

Run this local check set:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm audit --omit=dev
```

Do not include `node_modules/`, `out/`, private playlists, personal audio files, or local checkpoint data in a release commit.
