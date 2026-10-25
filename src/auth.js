import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

// Async scrypt runs on libuv's thread pool, so a hash in progress doesn't stop the server answering
// other requests. scryptSync blocked the event loop for ~21 ms per hash (PERF-001).
const scryptAsync = promisify(scrypt);

/** Hash a password with a random salt (scrypt). Resolves to { hash, salt } as hex strings. */
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scryptAsync(password, salt, 64)).toString('hex');
  return { hash, salt };
}

/** Verify a password against a stored hash + salt, using a constant-time comparison. */
export async function verifyPassword(password, hash, salt) {
  const candidate = await scryptAsync(password, salt, 64);
  const stored = Buffer.from(hash, 'hex');
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
}

/** Generate an opaque session token. */
export function generateToken() {
  return randomBytes(24).toString('hex');
}
