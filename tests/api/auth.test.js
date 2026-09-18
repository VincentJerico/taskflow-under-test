import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { createDb } from '../../src/db.js';
import { bearer } from '../helpers.js';

/** Milestone 4 — Auth API coverage. */
describe('Auth API', () => {
  let app;
  beforeEach(() => {
    app = createApp(createDb(':memory:'));
  });

  it('registers a new user (201)', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'alice', password: 'pw123456' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ username: 'alice' });
    expect(res.body.id).toBeGreaterThan(0);
  });

  it.each([
    [{ username: 'x' }, 'missing password'],
    [{ password: 'y' }, 'missing username'],
    [{}, 'both missing'],
  ])('rejects registration with %s → 400', async (body) => {
    const res = await request(app).post('/api/auth/register').send(body);
    expect(res.status).toBe(400);
  });

  it('rejects a duplicate username (409)', async () => {
    await request(app).post('/api/auth/register').send({ username: 'bob', password: 'pw123456' });
    const res = await request(app).post('/api/auth/register').send({ username: 'bob', password: 'other123' });
    expect(res.status).toBe(409);
  });

  it('logs in with valid credentials and returns a token', async () => {
    await request(app).post('/api/auth/register').send({ username: 'carol', password: 'pw123456' });
    const res = await request(app).post('/api/auth/login').send({ username: 'carol', password: 'pw123456' });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
  });

  it('gives the SAME error for wrong username vs wrong password (no user enumeration)', async () => {
    await request(app).post('/api/auth/register').send({ username: 'dave', password: 'pw123456' });
    const wrongUser = await request(app).post('/api/auth/login').send({ username: 'nope', password: 'pw123456' });
    const wrongPass = await request(app).post('/api/auth/login').send({ username: 'dave', password: 'wrong' });
    expect(wrongUser.status).toBe(401);
    expect(wrongPass.status).toBe(401);
    expect(wrongUser.body).toEqual(wrongPass.body); // identical response
  });

  it('logout invalidates the token', async () => {
    await request(app).post('/api/auth/register').send({ username: 'eve', password: 'pw123456' });
    const { body } = await request(app).post('/api/auth/login').send({ username: 'eve', password: 'pw123456' });
    const token = body.token;

    // token works before logout
    expect((await request(app).get('/api/tasks').set(bearer(token))).status).toBe(200);
    // logout
    expect((await request(app).post('/api/auth/logout').set(bearer(token))).status).toBe(204);
    // token no longer works
    expect((await request(app).get('/api/tasks').set(bearer(token))).status).toBe(401);
  });
});
