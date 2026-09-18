import { Router } from 'express';
import { validateTaskInput } from '../validators.js';

/**
 * Task routes — all scoped to the authenticated user (req.userId, set by requireAuth).
 * Ownership rules: a task that exists but belongs to another user returns 403; a task that
 * does not exist returns 404.
 */
export function tasksRouter(db) {
  const router = Router();

  // Load a task and enforce ownership. Returns the task or sends the error response.
  function loadOwnedTask(req, res) {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return null;
    }
    if (task.user_id !== req.userId) {
      res.status(403).json({ error: 'You do not have access to this task' });
      return null;
    }
    return task;
  }

  // List the current user's tasks
  router.get('/', (req, res) => {
    const rows = db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY id').all(req.userId);
    res.json(rows);
  });

  // Get one owned task
  router.get('/:id', (req, res) => {
    const task = loadOwnedTask(req, res);
    if (task) res.json(task);
  });

  // Create
  router.post('/', (req, res) => {
    const result = validateTaskInput(req.body ?? {});
    if (!result.ok) return res.status(400).json({ error: result.error });
    const { title, status, due_date } = result.value;
    const info = db
      .prepare('INSERT INTO tasks (user_id, title, status, due_date) VALUES (?, ?, ?, ?)')
      .run(req.userId, title, status, due_date);
    const created = db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(created);
  });

  // Full update
  router.put('/:id', (req, res) => {
    const task = loadOwnedTask(req, res);
    if (!task) return;
    const result = validateTaskInput(req.body ?? {});
    if (!result.ok) return res.status(400).json({ error: result.error });
    const { title, status, due_date } = result.value;
    db.prepare('UPDATE tasks SET title = ?, status = ?, due_date = ? WHERE id = ?').run(
      title,
      status,
      due_date,
      task.id,
    );
    res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id));
  });

  // Delete
  router.delete('/:id', (req, res) => {
    const task = loadOwnedTask(req, res);
    if (!task) return;
    db.prepare('DELETE FROM tasks WHERE id = ?').run(task.id);
    res.status(204).end();
  });

  return router;
}
