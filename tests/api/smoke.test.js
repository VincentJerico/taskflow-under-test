import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { createDb } from '../../src/db.js';

/** Milestone 1 smoke tests — app boots, health works, tasks endpoint round-trips. */
describe('TaskFlow smoke (Milestone 1)', () => {
  let app;

  beforeEach(() => {
    app = createApp(createDb(':memory:')); // fresh isolated DB per test
  });

  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET /api/tasks is empty initially', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST /api/tasks creates a task (201)', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Write tests' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: 'Write tests', status: 'todo' });
    expect(res.body.id).toBeGreaterThan(0);
  });

  it('POST /api/tasks without a title returns 400', async () => {
    const res = await request(app).post('/api/tasks').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/i);
  });
});
