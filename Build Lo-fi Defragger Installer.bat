@echo off
setlocal

call "%~dp0build-windows.bat"
set "exit_code=%errorlevel%"

if not "%exit_code%"=="0" (
  echo.
  echo The Windows installer build did not finish. Review the message above and try again.
  echo.
  pause
)

exit /b %exit_code%
