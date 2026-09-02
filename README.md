# CostTrack

A standalone React cost tracker for projects, contractors, and expenses. Data is stored locally in the browser, so no backend or account setup is required for the current workflow.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install` once.
3. Run `npm run dev` and open the displayed local URL.

For a production bundle, run `npm run build` and then `npm run preview`.

The app works on Windows and macOS. The included `start-windows.bat` and `start-mac.command` scripts install dependencies and start the local app with one click after Node.js is installed.

## Included workflow

- Create and select projects.
- Add contractors to the selected project.
- Log an amount and description against a project and contractor.
- Review project spend, contractor totals, and recent expenses.

All records persist in `localStorage` on the current browser/device.
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
