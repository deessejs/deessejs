# Electron Starter

Production-ready Electron application template with React 19, TanStack Start, Drizzle ORM, and oRPC.

## Stack

- **Shell:** Electron 32
- **UI:** React 19 + TanStack Start
- **Database:** Drizzle ORM (SQLite locally, Postgres in prod)
- **API contracts:** oRPC end-to-end typed
- **Build:** Vite + electron-builder

## Getting started

```bash
deessejs init electron-starter
cd electron-starter
pnpm install
pnpm dev
```

## What's included

- Auto-update wiring
- Native menus and tray icons
- IPC typed via oRPC contracts shared between main and renderer
- Crash reporting and structured logs
- macOS notarisation scripts
