# Test Strategy — TaskFlow

How TaskFlow is tested, and why. The goal is **high confidence at low cost** by putting each check at
the cheapest layer that can catch its class of bug.

## The test pyramid (as applied here)
```
        ╱  E2E (Playwright)  ╲        4 tests  — real browser user journeys
       ╱─────────────────────╲
      ╱   API (Supertest)     ╲      28 tests  — HTTP contract, auth, access control
     ╱─────────────────────────╲
    ╱   Unit (Vitest)           ╲    27 tests  — pure validation/logic, EP + BVA
   ╱─────────────────────────────╲
```
Total: **55 unit/API + 4 E2E = 59 automated tests**, all in CI.

## What each layer owns
| Layer | Tool | Responsible for | Examples |
|-------|------|-----------------|----------|
| **Unit** | Vitest | Pure logic with no I/O — fast, exhaustive edge cases | title/status/due-date validators; impossible dates (`2026-02-31`) |
| **API** | Supertest | HTTP contract, status codes, auth, access control, DB round-trips | CRUD lifecycle, 401/400/404, cross-user **403** |
| **E2E** | Playwright | Critical user journeys through the real UI + server | register→login→add→complete→logout; session persistence |

**Rule of thumb:** if a unit test can catch it, don't write an E2E test for it. E2E is reserved for
"does the whole thing work for a user", not for validating every branch.

## Design choices that make testing cheap
- **Dependency-injected DB** (`createApp(db)`) → every API test runs against a fresh **in-memory**
  SQLite database. No shared state, no cleanup, no flakiness.
- **Pure validators** in `src/validators.js` → logic is unit-testable without spinning up Express.
- **Playwright `webServer`** starts the app itself against a throwaway DB → E2E needs no manual setup.
- **Unique usernames per test** → tests are independent even against a persistent E2E DB.

## Techniques used
- **Equivalence partitioning & boundary value analysis** — validator inputs (valid/blank/wrong-type;
  date edges and impossible calendar dates).
- **Positive & negative paths** — happy path plus 400/401/403/404 for every relevant endpoint.
- **Access-control testing** — asserts both the status code (403) *and* the side effect (victim's
  data untouched, not listed).
- **Contract assertions** — pins exact status codes (e.g. `201` on create), not just "2xx".

## Traceability
Test titles carry intent (e.g. `access control > returns 403 on cross-user GET/PUT/DELETE`), and the
[BUGS-FOUND.md](BUGS-FOUND.md) exercise maps real defects to the tests that catch them.

## Coverage & gaps (honest)
Covered: validation logic, all task endpoints, auth lifecycle, access control, core UI journeys.
Not covered (deliberately, for scope): rate limiting/lockout, pagination, concurrency, load testing
(the sibling [qa-engineering-journey](https://github.com/VincentJerico/qa-engineering-journey) repo
covers performance with k6), and cross-browser E2E (Chromium only here).

## Running
```bash
npm test           # unit + API (Vitest)
npm run test:e2e   # E2E (Playwright)
```
CI runs both on every push (`.github/workflows/ci.yml`).
