import express from 'express';
import { tasksRouter } from './routes/tasks.js';

/** Build the Express app around a given database (injectable for tests). */
export function createApp(db) {
  const app = express();
  app.use(express.json());
  app.use(express.static('public'));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/api/tasks', tasksRouter(db));

  return app;
}
