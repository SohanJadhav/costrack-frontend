# Windows Setup Guide: CostTrack Frontend

This guide walks you through setting up and running the **CostTrack Frontend (React + Vite)** on **Windows 10 / 11 (64-bit)** for the first time from a fresh repository clone.

---

## 1. Prerequisites & Required Tools

Before starting, install the following tools on your Windows computer:

### 1. Node.js & npm (LTS Version - Recommended: Node 20.x or 22.x)
- **Official Download Link**: [https://nodejs.org/en/download](https://nodejs.org/en/download)
- **Direct Windows 64-bit Installer (.msi)**: Select the **LTS (Long Term Support)** version.
- **Installation steps**:
  1. Double-click the downloaded `.msi` file.
  2. Follow the setup wizard (accept terms and click Next).
  3. Keep the default options checked (including npm package manager and Add to PATH).
  4. Complete the installation.
- **Verify installation**:
  Open Command Prompt (`cmd.exe`) or PowerShell and type:
  ```cmd
  node -v
  npm -v
  ```
  *(You should see versions like `v20.x.x` or `v22.x.x` and npm version `10.x.x`)*

---

### 2. Git for Windows
- **Official Download Link**: [https://git-scm.com/download/win](https://git-scm.com/download/win)
- **Direct 64-bit Setup**: Download **64-bit Git for Windows Setup**.
- **Installation steps**:
  1. Run the installer.
  2. Keep default settings (ensure "Git from command line and also 3rd party software" is selected).
  3. Complete the setup.
- **Verify installation**:
  ```cmd
  git --version
  ```

---

### 3. Modern Web Browser
- Google Chrome: [https://www.google.com/chrome/](https://www.google.com/chrome/)
- Microsoft Edge (pre-installed on Windows 10/11)

---

## 2. First-Time Setup Instructions

### Step 1: Open Terminal and Navigate to Directory
Open PowerShell or Command Prompt:
```cmd
git clone <repository-url>
cd CostTrack\costrack-frontend
```

### Step 2: Install Node Dependencies
Run the following command in the `costrack-frontend` folder:
```cmd
npm install
```
*(This downloads all required libraries such as React, Vite, and development dependencies into `node_modules`.)*

---

## 3. Running the Frontend

### Method 1: One-Click Startup (Recommended)
Double-click `start-windows.bat` in the `costrack-frontend` directory.

The script will automatically:
1. Check if `node_modules` exists (runs `npm install` automatically if needed).
2. Launch the Vite development server.
3. Automatically open your default web browser to [http://localhost:5173](http://localhost:5173).

### Method 2: Command Line (PowerShell / Command Prompt)
```cmd
cd costrack-frontend
npm run dev
```
Then open your browser and navigate to:
```
http://localhost:5173
```

---

## 4. Production Build (Optional)
To test or build the optimized production distribution:
```cmd
npm run build
```
This generates the standalone production files inside the `dist/` directory.

---

## 5. Connecting to the Backend

The frontend is configured to communicate with the CostTrack backend API running at:
```
http://localhost:8080/api/v1
```
> **Note**: Make sure your backend server is running (via `start-windows.bat` in `costrack-backend`) before logging into the frontend.

### Login Credentials:
- **Admin**: `costtracker@gmail.com` / `Nashik123`
- **Contractor Manager**: `contractor.manager@gmail.com` / `Nashik000`
- **Viewer**: `cost.tracker_viewer@gmail.com` / `Nashik333`

---

## 6. Troubleshooting on Windows

### 1. PowerShell Script Execution Policy Error
If running `npm` or Vite commands in PowerShell shows an error like:
`File ... cannot be loaded because running scripts is disabled on this system.`
- **Fix**: Open PowerShell as Administrator or in the current session run:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  ```
- Or use standard **Command Prompt (`cmd.exe`)** instead.

### 2. Port 5173 Already in Use
If port 5173 is occupied, Vite will automatically prompt or switch to port 5174 (`http://localhost:5174`).
To free port 5173:
```cmd
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### 3. "Cannot connect to backend" or "Failed to fetch" on Login
- Ensure `costrack-backend` is running on `http://localhost:8080`.
- Verify in your browser by opening [http://localhost:8080/health](http://localhost:8080/health) — it should display `{"status":"ok"}`.

