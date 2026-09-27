@echo off
setlocal
cd /d "%~dp0"

echo ========================================================
echo CostTrack Frontend Development Server (Windows)
echo ========================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in your PATH!
    echo Please download and install Node.js LTS from: https://nodejs.org/en/download
    echo.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm is not installed or not in your PATH!
    echo Please install Node.js (which includes npm) from: https://nodejs.org/en/download
    echo.
    pause
    exit /b 1
)

if not exist "%~dp0node_modules" (
    echo [INFO] First time setup detected: installing node dependencies...
    echo Running npm install...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] npm install failed. Please check your internet connection.
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed successfully.
    echo.
)

echo Starting Vite dev server on http://localhost:5173 ...
echo Press Ctrl+C in this window to stop the server.
echo.

start "" "http://localhost:5173"
call npm run dev
pause