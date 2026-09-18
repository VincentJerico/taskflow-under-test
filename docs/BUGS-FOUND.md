# Bugs Found — Seed & Catch Exercise

To prove the test suite has real teeth, I deliberately introduced four realistic bugs — one at a time
— ran the tests, and confirmed each was **caught** (the suite went red with a clear message). Every bug
was then reverted, so `main` stays green.

This is the point of the whole repo: a test suite is only valuable if it *fails when the code is wrong*.

| # | Seeded bug | Type | Caught by | Failure |
|---|-----------|------|-----------|---------|
| 1 | Title validation removed | Missing input validation | 6 unit tests | empty/blank/null titles wrongly accepted |
| 2 | Ownership check removed | **Broken access control** | 1 API test | cross-user access returned 200 instead of 403 |
| 3 | Create returns 200 | Wrong status code | 2 API tests | `expected 200 to be 201` |
| 4 | Calendar check removed | Weak date validation | 5 unit tests | `2026-02-31`, `2026-13-01` wrongly accepted |

---

## Bug 1 — Missing title validation
**Change:** made `validateTitle` accept anything (removed the empty/type check).
**Caught by:** `tests/unit/validators.test.js` — 6 failures.
```
× validateTitle > rejects  (empty)
× validateTitle > rejects     (whitespace only)
× validateTitle > rejects undefined (undefined)
× validateTitle > rejects null (null)
× validateTitle > rejects 42 (non-string)
× validateTaskInput > fails fast on the first invalid field (title before status)
```
**Impact:** empty/garbage tasks could be created. **Fix:** restore the trim + type guard.

## Bug 2 — Broken access control (the important one)
**Change:** removed the `task.user_id !== req.userId` ownership check in `loadOwnedTask`.
**Caught by:** `tests/api/tasks.test.js` — cross-user access control.
```
× Tasks API > access control > returns 403 on cross-user GET/PUT/DELETE
  → expected 200 to be 403
```
**Impact:** any authenticated user could **read, edit, or delete another user's tasks** — a serious
IDOR-style vulnerability. This is exactly why the access-control test asserts a 403 *and* that the
victim's data is untouched. **Fix:** restore the ownership check.

## Bug 3 — Wrong status code on create
**Change:** `POST /api/tasks` returned `200` instead of `201 Created`.
**Caught by:** `tests/api/tasks.test.js` and `tests/api/smoke.test.js` — 2 failures.
```
× create > creates a task (201) with defaults   → expected 200 to be 201
× smoke > authed user can create and list tasks → expected 200 to be 201
```
**Impact:** breaks REST contract; clients relying on 201 misbehave. **Fix:** return 201.

## Bug 4 — Weak due-date validation
**Change:** removed the calendar-validity guard, so only the `YYYY-MM-DD` *format* was checked.
**Caught by:** `tests/unit/validators.test.js` — 5 failures.
```
× rejects impossible calendar date 2026-02-31 (Feb 31 does not exist) → expected true to be false
× rejects impossible calendar date 2026-13-01 (month 13)             → expected true to be false
× rejects impossible calendar date 2026-00-10 (month 0)              → expected true to be false
× rejects impossible calendar date 2026-04-31 (April has 30 days)    → expected true to be false
```
**Impact:** impossible dates enter the data store. **Fix:** restore the `Date` round-trip check.

---

## Takeaways
- **Coverage across layers pays off:** unit tests caught the logic/validation bugs instantly and
  cheaply; API tests caught the contract and access-control bugs that unit tests can't see.
- **The access-control test (Bug 2) is the highest-value test in the repo** — it guards a real
  security boundary, and asserts the side effect (victim data intact), not just a status code.
- **Assert specific values**, not just "no error." Bug 3 only surfaced because the test pins `201`,
  not "a 2xx".

## How this was run
Each bug was applied locally, the relevant suite was run to capture the failure, then reverted with
`git checkout -- <file>`. `main` was verified green (55/55) afterward.
