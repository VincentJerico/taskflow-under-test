import { Router } from 'express';

const VALID_STATUS = ['todo', 'doing', 'done'];

/** Task routes. Takes the db so tests can inject an in-memory database. */
export function tasksRouter(db) {
  const router = Router();

  // List tasks
  router.get('/', (req, res) => {
    const rows = db.prepare('SELECT * FROM tasks ORDER BY id').all();
    res.json(rows);
  });

  // Get one task
  router.get('/:id', (req, res) => {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  });

  // Create a task
  router.post('/', (req, res) => {
    const { title, status = 'todo', due_date = null } = req.body ?? {};
    if (!title || String(title).trim() === '') {
      return res.status(400).json({ error: 'title is required' });
    }
    if (!VALID_STATUS.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${VALID_STATUS.join(', ')}` });
    }
    const info = db
      .prepare('INSERT INTO tasks (title, status, due_date) VALUES (?, ?, ?)')
      .run(String(title).trim(), status, due_date);
    const created = db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(created);
  });

  return router;
}
