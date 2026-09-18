import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { createDb } from '../../src/db.js';
import { registerAndLogin, bearer } from '../helpers.js';

/** Smoke tests — app boots, health works, auth gates tasks, basic authed flow round-trips. */
describe('TaskFlow smoke', () => {
  let app;

  beforeEach(() => {
    app = createApp(createDb(':memory:')); // fresh isolated DB per test
  });

  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET /api/tasks without a token returns 401', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });

  it('authed user can create and list their tasks', async () => {
    const { token } = await registerAndLogin(app);

    const created = await request(app)
      .post('/api/tasks')
      .set(bearer(token))
      .send({ title: 'Write tests' });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ title: 'Write tests', status: 'todo' });

    const list = await request(app).get('/api/tasks').set(bearer(token));
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].title).toBe('Write tests');
  });

  it('POST /api/tasks without a title returns 400', async () => {
    const { token } = await registerAndLogin(app);
    const res = await request(app).post('/api/tasks').set(bearer(token)).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/i);
  });
});
