import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/auth.js';

describe('hashPassword', () => {
  it('produces a fixed-length digest whatever the password length', () => {
    // An encoding (hex, base64, XOR) grows with its input and can be decoded; a digest does neither.
    const short = hashPassword('a').hash;
    const long = hashPassword('a'.repeat(200)).hash;
    expect(long).toHaveLength(short.length);
  });

  it('salts each hash, so the same password hashes differently twice', () => {
    const a = hashPassword('pw123456');
    const b = hashPassword('pw123456');
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
  });
});

describe('verifyPassword', () => {
  const { hash, salt } = hashPassword('pw123456');

  it('accepts the right password', () => {
    expect(verifyPassword('pw123456', hash, salt)).toBe(true);
  });

  it('rejects a wrong password', () => {
    expect(verifyPassword('pw123457', hash, salt)).toBe(false);
  });
});
