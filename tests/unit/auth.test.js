import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/auth.js';

describe('hashPassword', () => {
  it('produces a fixed-length digest whatever the password length', async () => {
    // An encoding (hex, base64, XOR) grows with its input and can be decoded; a digest does neither.
    const short = (await hashPassword('a')).hash;
    const long = (await hashPassword('a'.repeat(200))).hash;
    expect(long).toHaveLength(short.length);
  });

  it('salts each hash, so the same password hashes differently twice', async () => {
    const a = await hashPassword('pw123456');
    const b = await hashPassword('pw123456');
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
  });

  it('does not block the event loop while hashing (PERF-001)', async () => {
    // With scryptSync the whole ~20 ms hash runs on the main thread, so this callback can only
    // fire after the hash is done and awaited. With async scrypt the hash runs on the libuv thread pool and
    // the event loop keeps turning.
    let turned = false;
    setImmediate(() => (turned = true));
    await hashPassword('pw123456');
    expect(turned).toBe(true);
  });
});

describe('verifyPassword', async () => {
  const { hash, salt } = await hashPassword('pw123456');

  it('accepts the right password', async () => {
    expect(await verifyPassword('pw123456', hash, salt)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    expect(await verifyPassword('pw123457', hash, salt)).toBe(false);
  });
});
