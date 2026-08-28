@echo off
setlocal

pushd "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Lo-fi Defragger needs Node.js 22 LTS before its first run.
  echo Install it from https://nodejs.org/, then double-click this file again.
  echo.
  pause
  popd
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo.
  echo npm was not found with Node.js. Reinstall Node.js 22 LTS, then try again.
  echo.
  pause
  popd
  exit /b 1
)

if not exist "node_modules" (
  echo Preparing Lo-fi Defragger for its first launch...
  call npm ci
  if errorlevel 1 (
    echo.
    echo Setup did not finish. Check your internet connection, then try again.
    echo.
    pause
    popd
    exit /b 1
  )
)

echo Starting Lo-fi Defragger...
call npm run dev
set "exit_code=%errorlevel%"

if not "%exit_code%"=="0" (
  echo.
  echo Lo-fi Defragger closed with an error. The message above should help diagnose it.
  echo.
  pause
)

popd
exit /b %exit_code%
