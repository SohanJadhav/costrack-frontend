@echo off
setlocal

echo Stopping CostTrack frontend Vite dev server...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq CostTrack*" >nul 2>&1
echo Done.
pause

