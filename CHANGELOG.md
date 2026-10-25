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

### Changed

- New UI: dark theme, labelled form fields, visible keyboard focus, and a progress bar with one
  segment per task. All `data-testid` hooks are unchanged.

### Fixed

- Password hashing no longer blocks the server. `hashPassword` / `verifyPassword` use async
  `crypto.scrypt` instead of `scryptSync`, so a burst of logins no longer stalls every other request
  ([PERF-001](https://github.com/VincentJerico/performance-testing/blob/main/docs/FINDINGS.md)).
  Register and login handlers are async and pass errors to Express with `next(err)`.
- A task title typed while the previous task was still saving was appended to that task's title.
  The input is now cleared before the request is sent. Caught by a new E2E test.

## [0.1.0] - 2026-09-18

### Added

- Task-manager app: auth (register/login/logout), tasks CRUD, per-user access control, validation.
- Test suite: 27 unit + 28 API (Vitest/Supertest) + 4 E2E (Playwright).
- Seed-and-catch-bugs exercise (`docs/BUGS-FOUND.md`) and test strategy (`docs/TEST-STRATEGY.md`).
- Tooling & standards: ESLint + Prettier, coverage, CI (lint/test/e2e), Dependabot,
  issue/PR templates, CONTRIBUTING, SECURITY, MIT license.
- Deployment config for Render (`render.yaml`, `DEPLOY.md`).
