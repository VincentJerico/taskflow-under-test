import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { createDb } from '../../src/db.js';
import { registerAndLogin, bearer } from '../helpers.js';

/** Milestone 4 — Tasks API coverage: CRUD, validation, auth, and access control. */
describe('Tasks API', () => {
  let app;
  let token;

  beforeEach(async () => {
    app = createApp(createDb(':memory:'));
    ({ token } = await registerAndLogin(app));
  });

  describe('auth gate', () => {
    it.each([
      ['get', '/api/tasks'],
      ['post', '/api/tasks'],
      ['get', '/api/tasks/1'],
      ['put', '/api/tasks/1'],
      ['delete', '/api/tasks/1'],
    ])('%s %s without a token → 401', async (method, path) => {
      const res = await request(app)[method](path);
      expect(res.status).toBe(401);
    });

    it('rejects a bogus token → 401', async () => {
      const res = await request(app).get('/api/tasks').set(bearer('not-a-real-token'));
      expect(res.status).toBe(401);
    });
  });

  describe('create', () => {
    it('creates a task (201) with defaults', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set(bearer(token))
        .send({ title: 'Task A' });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ title: 'Task A', status: 'todo', due_date: null });
    });

    it.each([
      [{}, 'missing title'],
      [{ title: '   ' }, 'blank title'],
      [{ title: 'ok', status: 'bogus' }, 'invalid status'],
      [{ title: 'ok', due_date: '2026-02-31' }, 'impossible date'],
      [{ title: 'ok', due_date: '05/10/2026' }, 'bad date format'],
    ])('rejects invalid create %s → 400', async (body) => {
      const res = await request(app).post('/api/tasks').set(bearer(token)).send(body);
      expect(res.status).toBe(400);
    });
  });

  describe('read / update / delete lifecycle', () => {
    it('runs the full CRUD lifecycle', async () => {
      const created = await request(app)
        .post('/api/tasks')
        .set(bearer(token))
        .send({ title: 'Lifecycle', status: 'todo', due_date: '2026-10-05' });
      const id = created.body.id;

      // read
      const got = await request(app).get(`/api/tasks/${id}`).set(bearer(token));
      expect(got.status).toBe(200);
      expect(got.body.title).toBe('Lifecycle');

      // update
      const updated = await request(app)
        .put(`/api/tasks/${id}`)
        .set(bearer(token))
        .send({ title: 'Lifecycle v2', status: 'done', due_date: null });
      expect(updated.status).toBe(200);
      expect(updated.body).toMatchObject({ title: 'Lifecycle v2', status: 'done', due_date: null });

      // delete
      expect((await request(app).delete(`/api/tasks/${id}`).set(bearer(token))).status).toBe(204);

      // verify gone
      expect((await request(app).get(`/api/tasks/${id}`).set(bearer(token))).status).toBe(404);
    });

    it('returns 404 for a non-existent task', async () => {
      const res = await request(app).get('/api/tasks/99999').set(bearer(token));
      expect(res.status).toBe(404);
    });

    it("only lists the current user's tasks", async () => {
      await request(app).post('/api/tasks').set(bearer(token)).send({ title: 'Mine 1' });
      await request(app).post('/api/tasks').set(bearer(token)).send({ title: 'Mine 2' });
      const list = await request(app).get('/api/tasks').set(bearer(token));
      expect(list.body).toHaveLength(2);
    });
  });

  describe("access control (a user cannot touch another user's task)", () => {
    it('returns 403 on cross-user GET/PUT/DELETE', async () => {
      // User A creates a task
      const created = await request(app)
        .post('/api/tasks')
        .set(bearer(token))
        .send({ title: 'A private task' });
      const id = created.body.id;

      // User B (different account) tries to access it
      const { token: tokenB } = await registerAndLogin(app);

      expect((await request(app).get(`/api/tasks/${id}`).set(bearer(tokenB))).status).toBe(403);
      expect(
        (await request(app).put(`/api/tasks/${id}`).set(bearer(tokenB)).send({ title: 'hijack' }))
          .status,
      ).toBe(403);
      expect((await request(app).delete(`/api/tasks/${id}`).set(bearer(tokenB))).status).toBe(403);

      // And B does not see A's task in their list
      const listB = await request(app).get('/api/tasks').set(bearer(tokenB));
      expect(listB.body).toHaveLength(0);

      // A's task is untouched
      const stillThere = await request(app).get(`/api/tasks/${id}`).set(bearer(token));
      expect(stillThere.status).toBe(200);
      expect(stillThere.body.title).toBe('A private task');
    });
  });
});
