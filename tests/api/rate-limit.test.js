import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { createDb } from '../../src/db.js';
import { registerAndLogin, bearer } from '../helpers.js';

/** Rate limiting on /api/auth/register and /api/auth/login (PERF-001). */
describe('Auth rate limiting', () => {
  const badLogin = (app) =>
    request(app).post('/api/auth/login').send({ username: 'mallory', password: 'guess' });

  it('answers 429 with a JSON error once a client goes over the limit', async () => {
    const app = createApp(createDb(':memory:'), { authRateLimit: 3 });
    for (let i = 0; i < 3; i++) expect((await badLogin(app)).status).toBe(401);

    const res = await badLogin(app);
    expect(res.status).toBe(429);
    expect(res.body).toEqual({ error: 'too many requests, try again later' });
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('counts register and login against the same budget', async () => {
    const app = createApp(createDb(':memory:'), { authRateLimit: 2 });
    await registerAndLogin(app); // 1 register + 1 login
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'late', password: 'pw123456' });
    expect(res.status).toBe(429);
  });

  it('does not limit logout or the task routes', async () => {
    const app = createApp(createDb(':memory:'), { authRateLimit: 2 });
    const { token } = await registerAndLogin(app);
    for (let i = 0; i < 5; i++) {
      expect((await request(app).get('/api/tasks').set(bearer(token))).status).toBe(200);
    }
    expect((await request(app).post('/api/auth/logout').set(bearer(token))).status).toBe(204);
  });

  it('can be turned off with a limit of 0', async () => {
    const app = createApp(createDb(':memory:'), { authRateLimit: 0 });
    for (let i = 0; i < 25; i++) expect((await badLogin(app)).status).toBe(401);
  });

  it.each([-1, 1.5, NaN])('refuses to start with an invalid limit (%s)', (authRateLimit) => {
    expect(() => createApp(createDb(':memory:'), { authRateLimit })).toThrow(/AUTH_RATE_LIMIT/);
  });
});
