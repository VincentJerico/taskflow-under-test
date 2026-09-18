import express from 'express';
import { authRouter } from './routes/auth.js';
import { tasksRouter } from './routes/tasks.js';
import { requireAuth } from './middleware/requireAuth.js';

/** Build the Express app around a given database (injectable for tests). */
export function createApp(db) {
  const app = express();
  app.use(express.json());
  app.use(express.static('public'));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRouter(db));
  app.use('/api/tasks', requireAuth(db), tasksRouter(db)); // all task routes require auth

  return app;
}
