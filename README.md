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
- [ ] M3 — Unit tests (validators / logic)
- [ ] M4 — API tests (endpoints, auth, access control)
- [ ] M5 — E2E tests (Playwright user journeys)
- [ ] M6 — Seed + catch bugs (`docs/BUGS-FOUND.md`)
- [ ] M7 — Docs + polish

Plan: see `taskflow-under-test-plan.md` in the journey repo's `10-projects/`.
