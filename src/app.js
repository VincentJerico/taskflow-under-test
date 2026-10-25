import express from 'express';
import { authRouter } from './routes/auth.js';
import { tasksRouter } from './routes/tasks.js';
import { requireAuth } from './middleware/requireAuth.js';

/**
 * Build the Express app around a given database (injectable for tests).
 * authRateLimit: register + login requests allowed per client per minute; 0 turns it off.
 */
export function createApp(db, { authRateLimit = Number(process.env.AUTH_RATE_LIMIT ?? 20) } = {}) {
  if (!Number.isInteger(authRateLimit) || authRateLimit < 0) {
    throw new Error(`AUTH_RATE_LIMIT must be a whole number >= 0, got ${authRateLimit}`);
  }

  const app = express();
  app.use(express.json());
  app.use(express.static('public'));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRouter(db, { requestsPerMinute: authRateLimit }));
  app.use('/api/tasks', requireAuth(db), tasksRouter(db)); // all task routes require auth

  return app;
}
