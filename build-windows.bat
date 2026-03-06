@echo off
setlocal

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required to build the Windows EXE.
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm is required to build the Windows EXE.
  exit /b 1
)

pushd "%~dp0"

echo Installing dependencies...
call npm ci
if errorlevel 1 (
  popd
  exit /b 1
)

echo Building Windows EXE...
call npm run make:win
if errorlevel 1 (
  popd
  exit /b 1
)

echo Windows artifacts are in out\make\squirrel.windows\x64
if exist "out\make\squirrel.windows\x64" start "" "out\make\squirrel.windows\x64"

popd
exit /b 0
