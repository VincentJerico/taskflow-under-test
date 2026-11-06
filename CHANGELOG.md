# Changelog

All notable changes to this project are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- Rate limiting on `POST /api/auth/register` and `POST /api/auth/login`: 20 requests per minute per
  client IP by default, `429` with `Retry-After` past that. Configurable with `AUTH_RATE_LIMIT`
  (`0` turns it off). Uses `express-rate-limit`.
- Tests: hashing must not block the event loop, the 429 limit and its scope, invalid
  `AUTH_RATE_LIMIT` values, and a 500 (not a hung request) when hashing fails.
- UI: optional due dates (shown as "Due today", "Overdue: …" or the date), editing a title in
  place (Enter saves, Escape cancels), an All / To do / Done filter with counts, Undo after
  deleting a task, and a Show/Hide button on the password field.
- E2E tests for all of the above, plus empty sign-in fields, the 429 message, and a failed save
  (`tests/e2e/ux.spec.js`).

### Changed

- New UI: dark theme, labelled form fields, visible keyboard focus, and a progress bar with one
  segment per task. All `data-testid` hooks are unchanged.
- Sign-in is a real form: Enter submits and password managers work. Errors say what happened:
  empty fields, invalid credentials, a taken username, too many attempts (with the wait from
  `Retry-After`), or no connection.
- E2E tests run with `AUTH_RATE_LIMIT=0`, because every test signs up from one IP. The limit
  stays covered by `tests/api/rate-limit.test.js`.

### Fixed

- Password hashing no longer blocks the server. `hashPassword` / `verifyPassword` use async
  `crypto.scrypt` instead of `scryptSync`, so a burst of logins no longer stalls every other request
  ([PERF-001](https://github.com/VincentJerico/performance-testing/blob/main/docs/FINDINGS.md)).
  Register and login handlers are async and pass errors to Express with `next(err)`.
- A task title typed while the previous task was still saving was appended to that task's title.
  The input is now cleared before the request is sent. Caught by a new E2E test.
- A rate-limited login showed "Invalid credentials". It now says to wait and for how long.
- "Signed in as …" was blank after a page reload.
- Failed saves were silent and lost what was typed. Adding, renaming, completing or deleting a task
  now shows an error when the request fails, and a failed add puts the text back.

## [0.1.0] - 2026-09-18

### Added

- Task-manager app: auth (register/login/logout), tasks CRUD, per-user access control, validation.
- Test suite: 27 unit + 28 API (Vitest/Supertest) + 4 E2E (Playwright).
- Seed-and-catch-bugs exercise (`docs/BUGS-FOUND.md`) and test strategy (`docs/TEST-STRATEGY.md`).
- Tooling & standards: ESLint + Prettier, coverage, CI (lint/test/e2e), Dependabot,
  issue/PR templates, CONTRIBUTING, SECURITY, MIT license.
- Deployment config for Render (`render.yaml`, `DEPLOY.md`).
