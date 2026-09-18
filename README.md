# TaskFlow — App Under Test

![Status](https://img.shields.io/badge/status-in%20development-yellow)
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

## API (so far — Milestone 1)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | health check → `{ "status": "ok" }` |
| GET | `/api/tasks` | list tasks |
| GET | `/api/tasks/:id` | get one task (404 if missing) |
| POST | `/api/tasks` | create a task (400 if title missing / bad status) |

## Roadmap (milestones)
- [x] **M1 — Scaffold:** app skeleton, SQLite, tasks endpoint, CI green
- [ ] M2 — Build TaskFlow: auth + full tasks CRUD + business rules
- [ ] M3 — Unit tests (validators / logic)
- [ ] M4 — API tests (endpoints, auth, access control)
- [ ] M5 — E2E tests (Playwright user journeys)
- [ ] M6 — Seed + catch bugs (`docs/BUGS-FOUND.md`)
- [ ] M7 — Docs + polish

Plan: see `taskflow-under-test-plan.md` in the journey repo's `10-projects/`.
