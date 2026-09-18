# Security Policy

## Scope

TaskFlow is a portfolio/demo application, not a production service. It is intentionally simple; do not
store real or sensitive data in it.

## Reporting a vulnerability

If you find a security issue, please open a GitHub issue marked **[SECURITY]** or email
vincentjericoalcuran@gmail.com. Please avoid sharing exploit details publicly until it's addressed.

## Known, intentional limitations (demo scope)

- No rate limiting / account lockout on auth endpoints.
- Tokens are opaque DB-backed sessions without expiry.
- HTTPS/security headers are the host's responsibility (see DEPLOY.md).

These are acceptable for a demo but would be hardened for production.
