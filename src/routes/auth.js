import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { hashPassword, verifyPassword, generateToken } from '../auth.js';
import { requireAuth } from '../middleware/requireAuth.js';

/**
 * Auth routes: register, login, logout. Register and login share a per-client budget of
 * `requestsPerMinute` requests (0 turns the limit off).
 */
export function authRouter(db, { requestsPerMinute }) {
  const router = Router();
  const limiter =
    requestsPerMinute === 0
      ? (req, res, next) => next()
      : rateLimit({
          windowMs: 60_000,
          limit: requestsPerMinute,
          standardHeaders: 'draft-8',
          legacyHeaders: false,
          message: { error: 'too many requests, try again later' },
        });

  // Register
  router.post('/register', limiter, async (req, res, next) => {
    try {
      const { username, password } = req.body ?? {};
      if (!username || !password) {
        return res.status(400).json({ error: 'username and password are required' });
      }
      const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
      if (exists) return res.status(409).json({ error: 'username already taken' });

      const { hash, salt } = await hashPassword(password);
      const info = db
        .prepare('INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?)')
        .run(username, hash, salt);
      res.status(201).json({ id: info.lastInsertRowid, username });
    } catch (err) {
      next(err); // Express 4 doesn't catch rejected promises itself
    }
  });

  // Login → returns a token
  router.post('/login', limiter, async (req, res, next) => {
    try {
      const { username, password } = req.body ?? {};
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username ?? '');
      // Same generic message whether the user exists or the password is wrong (no user enumeration).
      if (!user || !(await verifyPassword(password ?? '', user.password_hash, user.salt))) {
        return res.status(401).json({ error: 'invalid credentials' });
      }
      const token = generateToken();
      db.prepare('INSERT INTO tokens (token, user_id) VALUES (?, ?)').run(token, user.id);
      res.json({ token });
    } catch (err) {
      next(err);
    }
  });

  // Logout → invalidates the current token
  router.post('/logout', requireAuth(db), (req, res) => {
    db.prepare('DELETE FROM tokens WHERE token = ?').run(req.token);
    res.status(204).end();
  });

  return router;
}
