import { Router } from 'express';
import { hashPassword, verifyPassword, generateToken } from '../auth.js';
import { requireAuth } from '../middleware/requireAuth.js';

/** Auth routes: register, login, logout. */
export function authRouter(db) {
  const router = Router();

  // Register
  router.post('/register', (req, res) => {
    const { username, password } = req.body ?? {};
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }
    const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (exists) return res.status(409).json({ error: 'username already taken' });

    const { hash, salt } = hashPassword(password);
    const info = db
      .prepare('INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?)')
      .run(username, hash, salt);
    res.status(201).json({ id: info.lastInsertRowid, username });
  });

  // Login → returns a token
  router.post('/login', (req, res) => {
    const { username, password } = req.body ?? {};
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username ?? '');
    // Same generic message whether the user exists or the password is wrong (no user enumeration).
    if (!user || !verifyPassword(password ?? '', user.password_hash, user.salt)) {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    const token = generateToken();
    db.prepare('INSERT INTO tokens (token, user_id) VALUES (?, ?)').run(token, user.id);
    res.json({ token });
  });

  // Logout → invalidates the current token
  router.post('/logout', requireAuth(db), (req, res) => {
    db.prepare('DELETE FROM tokens WHERE token = ?').run(req.token);
    res.status(204).end();
  });

  return router;
}
