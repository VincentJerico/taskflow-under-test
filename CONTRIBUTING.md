# Contributing

Thanks for your interest! This is a portfolio project, but it follows normal contribution standards.

## Getting started

```bash
npm install
npm run test:e2e:install   # one-time: Chromium for E2E
```

## Development workflow

1. Create a branch from `main` (`feat/…`, `fix/…`, `chore/…`).
2. Make your change **with tests**.
3. Run the full local gate before pushing:
   ```bash
   npm run lint
   npm run format:check
   npm test          # unit + API
   npm run test:e2e  # if UI/flow affected
   ```
4. Open a PR using the template. CI (lint, tests, e2e) must be green.

## Commit messages

Use clear, imperative messages; [Conventional Commits](https://www.conventionalcommits.org/) style is
preferred (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).

## Code style

- ESLint + Prettier are enforced (`npm run lint`, `npm run format`).
- 2-space indent, single quotes, semicolons, 100-char width (see `.prettierrc.json` / `.editorconfig`).

## Testing standards

- New logic → unit tests; new endpoints → API tests; new user flows → E2E.
- Assert specific values (status codes, fields), not just "no error".
- See [docs/TEST-STRATEGY.md](docs/TEST-STRATEGY.md).
