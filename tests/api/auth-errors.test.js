import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { createDb } from '../../src/db.js';

// Make hashing fail, to check the async route handlers pass the error on to Express. Express 4
// does not catch rejected promises: without next(err) the request would hang until the client
// gave up.
vi.mock('../../src/auth.js', async (importOriginal) => ({
  ...(await importOriginal()),
  hashPassword: () => Promise.reject(new Error('scrypt failed')),
  verifyPassword: () => Promise.reject(new Error('scrypt failed')),
}));

describe('Auth API when password hashing fails', () => {
  const app = createApp(createDb(':memory:'));

  it('register answers 500 instead of hanging', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', password: 'pw123456' })
      .timeout(2000);
    expect(res.status).toBe(500);
  });

  it('login answers 500 instead of hanging', async () => {
    const db = createDb(':memory:');
    db.prepare(
      "INSERT INTO users (username, password_hash, salt) VALUES ('bob', 'aa', 'bb')",
    ).run();
    const res = await request(createApp(db))
      .post('/api/auth/login')
      .send({ username: 'bob', password: 'pw123456' })
      .timeout(2000);
    expect(res.status).toBe(500);
  });
});
