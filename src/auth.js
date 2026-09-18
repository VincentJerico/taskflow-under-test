import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/** Hash a password with a random salt (scrypt). Returns { hash, salt } as hex strings. */
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

/** Verify a password against a stored hash + salt, using a constant-time comparison. */
export function verifyPassword(password, hash, salt) {
  const candidate = scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, 'hex');
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
}

/** Generate an opaque session token. */
export function generateToken() {
  return randomBytes(24).toString('hex');
}
