/**
 * Auth middleware factory. Reads a bearer token from the Authorization header,
 * resolves it to a user, and sets req.userId. Returns 401 when missing/invalid.
 */
export function requireAuth(db) {
  return (req, res, next) => {
    const header = req.get('authorization') || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) return res.status(401).json({ error: 'authentication required' });

    const row = db.prepare('SELECT user_id FROM tokens WHERE token = ?').get(match[1]);
    if (!row) return res.status(401).json({ error: 'invalid or expired token' });

    req.userId = row.user_id;
    req.token = match[1];
    next();
  };
}
