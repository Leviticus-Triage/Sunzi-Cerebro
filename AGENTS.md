# AGENTS.md

## Cursor Cloud specific instructions

### Project Overview

Sunzi Cerebro is an AI-powered security intelligence platform. The main application code lives under `exports/claude-import/` (frontend + backend). The root-level `src/` and `frontend/` directories are minimal stubs.

### Services

| Service | Directory | Port | Command |
|---------|-----------|------|---------|
| Frontend (React/Vite) | `exports/claude-import/` | 3000 | `npm run dev` |
| Backend (Express API) | `exports/claude-import/backend/` | 8890 | `node server.js` |

The backend uses SQLite in development mode (auto-created at `./data/sunzi_cerebro_dev.sqlite`). No external database service is needed.

### Running the app

1. **Backend:** `cd exports/claude-import/backend && NODE_ENV=development node server.js`
2. **Frontend:** `cd exports/claude-import && npm run dev`

The backend `.env` must have `PORT=8890` and `HOST=0.0.0.0` for the frontend to connect. Copy from `.env.example` and adjust.

### Known issues

- **Root `package.json`**: Had merge conflict markers making it invalid JSON. This breaks Vite (esbuild) and ESLint since they traverse up from `exports/claude-import/`. The fix was to restore valid JSON.
- **ESLint**: The root `.eslintrc.cjs` references `plugin:react` and `prettier` which are only installed in the root `node_modules`. ESLint in `exports/claude-import/` and `exports/claude-import/backend/` traverses up to this config. If ESLint fails, verify root `package.json` is valid JSON.
- **TypeScript**: `npx tsc --noEmit` in `exports/claude-import/` runs but has pre-existing type errors in service files (e.g. `enterpriseSecurity.ts`, `pwaService.ts`).
- **Backend tests (Jest)**: The `jest.config.js` has `testPathIgnorePatterns: ['/exports/']` which matches the workspace path `/workspace/exports/...`, causing all tests to be filtered out. Override with `--testPathIgnorePatterns='/node_modules/'`. Additionally, the test database config (`config/database.js`) uses PostgreSQL for `NODE_ENV=test`, which is not available in the dev environment. Tests require `NODE_OPTIONS='--experimental-vm-modules'` for ESM support.

### Build / Lint / Test commands

- **Frontend build:** `cd exports/claude-import && npm run build`
- **Frontend lint:** `cd exports/claude-import && npm run lint` (requires valid root `package.json`)
- **Frontend type-check:** `cd exports/claude-import && npm run type-check`
- **Backend lint:** `cd exports/claude-import/backend && npm run lint`
- **Backend tests:** `cd exports/claude-import/backend && NODE_OPTIONS='--experimental-vm-modules' npx jest --testPathIgnorePatterns='/node_modules/' --no-coverage`

### Authentication (dev)

The login page has a "Mock Login (Demo)" button that bypasses real authentication. For API testing, register a user via `POST /api/auth/register` and use the returned JWT token.
