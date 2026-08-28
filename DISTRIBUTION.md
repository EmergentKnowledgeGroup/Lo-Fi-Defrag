# Distribution

## Windows EXE

- Local Windows build: double-click `build-windows.bat` or run `npm run make:win` from Windows.
- GitHub one-click build: run the workflow in `.github/workflows/windows-exe.yml`.
- Expected output folder: `out/make/squirrel.windows/x64/`
- Expected artifacts:
  - `*.exe`
  - `RELEASES`
  - one or more `.nupkg` files

## macOS / Linux

- Use `python3 launch.py`.
- Default behavior:
  - if a packaged app for the current OS already exists, it launches that
  - otherwise it runs `npm ci` if needed and starts the app with `npm run dev`
- Useful options:
  - `python3 launch.py --dry-run`
  - `python3 launch.py --source`
  - `python3 launch.py --install`
