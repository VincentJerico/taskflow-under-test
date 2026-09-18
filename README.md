# TaskFlow — App Under Test

[![CI](https://github.com/VincentJerico/taskflow-under-test/actions/workflows/ci.yml/badge.svg)](https://github.com/VincentJerico/taskflow-under-test/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/tests-55%20unit%2FAPI%20%2B%204%20E2E-success)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

A small task-manager app **built to be tested end-to-end**. The point isn't the app — it's
demonstrating the full testing workflow on software I own: **unit → API → E2E → performance**, plus a
documented set of deliberately-seeded bugs and the tests that catch them.

Companion to my [QA Engineering Journey](https://github.com/VincentJerico/qa-engineering-journey).

## Stack
- **App:** Node + Express + SQLite (better-sqlite3) + a minimal static UI
- **Tests:** Vitest (unit), Supertest (API), Playwright (E2E — added later)
- **CI:** GitHub Actions

## Run
```bash
npm install
npm start          # http://localhost:3000
npm test           # unit + API tests
```

## API
Auth is token-based: `POST /api/auth/login` returns a token; send it as `Authorization: Bearer <token>`.
All `/api/tasks` routes require auth and are **scoped to the authenticated user**.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | — | health check → `{ "status": "ok" }` |
| POST | `/api/auth/register` | — | create account (400 missing fields, 409 taken) |
| POST | `/api/auth/login` | — | returns `{ token }` (401 invalid credentials) |
| POST | `/api/auth/logout` | ✓ | invalidate current token (204) |
| GET | `/api/tasks` | ✓ | list the user's tasks |
| GET | `/api/tasks/:id` | ✓ | get one (404 missing, 403 not owner) |
| POST | `/api/tasks` | ✓ | create (400 invalid input) |
| PUT | `/api/tasks/:id` | ✓ | full update (404/403/400) |
| DELETE | `/api/tasks/:id` | ✓ | delete (204; 404/403) |

**Business rules:** title required · status ∈ {todo, doing, done} · `due_date` optional but must be a
valid `YYYY-MM-DD` · users can only access their own tasks.

## Roadmap (milestones)
- [x] **M1 — Scaffold:** app skeleton, SQLite, tasks endpoint, CI green
- [x] **M2 — Build TaskFlow:** auth (register/login/logout), full tasks CRUD, business rules, access control
- [x] **M3 — Unit tests:** 27 validator cases (EP/BVA, incl. impossible dates)
- [x] **M4 — API tests:** 28 cases — auth flows, full CRUD lifecycle, 401/400/404, cross-user 403 access control
- [x] **M5 — E2E tests:** Playwright journeys (register→login→add→complete→logout, invalid login, session persistence, add/delete) + real UI
- [x] **M6 — Seed + catch bugs:** 4 deliberate bugs planted & caught — see [docs/BUGS-FOUND.md](docs/BUGS-FOUND.md)
- [x] **M7 — Docs + polish:** test strategy, README, CI badge — **project complete** ✅

## Testing
59 automated tests across the pyramid — **27 unit + 28 API + 4 E2E** — all in CI.
```bash
npm test              # unit + API (Vitest + Supertest)
npm run test:e2e      # E2E (Playwright — starts the app itself)
```
- **Test strategy:** [docs/TEST-STRATEGY.md](docs/TEST-STRATEGY.md) — the pyramid, layer ownership, techniques
- **Bugs found:** [docs/BUGS-FOUND.md](docs/BUGS-FOUND.md) — 4 seeded bugs and the tests that caught them

## Project structure
```
taskflow-under-test/
├── src/
│   ├── app.js  server.js  db.js  auth.js  validators.js
│   ├── routes/      auth.js  tasks.js
│   └── middleware/  requireAuth.js
├── public/index.html          # auth + tasks UI (data-testid hooks for E2E)
├── tests/
│   ├── unit/     validators.test.js        (27)
│   ├── api/      smoke / auth / tasks       (28)
│   └── e2e/      journey.spec.js            (4)
├── docs/         TEST-STRATEGY.md  BUGS-FOUND.md
└── .github/workflows/ci.yml    # unit+API job · E2E job
```

Plan: see `taskflow-under-test-plan.md` in the journey repo's `10-projects/`.
