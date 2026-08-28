# Distribution Guide

Lo-fi Defragger is an Electron Forge desktop app. This page separates the easy, click-first paths from the developer tooling so nobody has to guess which is which.

## Windows: Run It Without a Terminal

1. Install [Node.js 22 LTS](https://nodejs.org/).
2. Download the repository ZIP from GitHub and extract it.
3. Double-click `Run Lo-fi Defragger.bat`.

On the first run, the launcher performs the locked dependency install for you. It then starts the app. Future launches reuse that setup. The terminal window remains available only long enough to show a useful error if startup fails.

## Windows: Make Your Own Installer

Double-click `Build Lo-fi Defragger Installer.bat`. It delegates to the existing `build-windows.bat`, which runs a clean dependency install and packages the x64 Windows installer.

Expected output:

```text
out\make\squirrel.windows\x64\
  Lo-fi Defragger-<version> Setup.exe
  RELEASES
  *.nupkg
```

The installer is currently unsigned. Windows SmartScreen can warn about unsigned executables; do not advertise the result as a signed public release.

## Windows: Let GitHub Build It

The repository includes a manual **Build Windows EXE** workflow. Open the repository's **Actions** tab, select that workflow, choose **Run workflow**, and download `lofi-defragger-windows-exe` from the completed run. This produces the same `.exe`, `.nupkg`, and `RELEASES` artifacts without a local Node installation.

## Other Platforms

On macOS or Linux, `python3 launch.py` is the convenience launcher. It opens a packaged build when one exists for the current platform; otherwise it installs dependencies when needed and starts development mode.

| Target | Command | Result |
| --- | --- | --- |
| Current platform | `npm run build` | Packaged app under `out/` |
| Windows x64 | `npm run make:win` | Squirrel installer artifacts under `out/make/squirrel.windows/x64/` |
| Linux | `npm run make:linux` | Debian and RPM packages under `out/make/` |
| macOS | `npm run make:mac` | ZIP archive under `out/make/zip/` |

Build platform-specific packages on their matching operating system.

## Before Publishing a Release

Run this local check set:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm audit --omit=dev
```

Do not include `node_modules/`, `out/`, private playlists, personal audio files, or local checkpoint data in a release commit.
