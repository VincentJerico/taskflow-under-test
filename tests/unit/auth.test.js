import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/auth.js';

describe('hashPassword', () => {
  it('does not store the password in a reversible form', () => {
    const { hash } = hashPassword('pw123456');
    expect(hash).not.toBe(Buffer.from('pw123456').toString('hex'));
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
