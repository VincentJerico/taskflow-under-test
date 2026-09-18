import request from 'supertest';

let counter = 0;

/** Register a fresh user and return an auth token + credentials. */
export async function registerAndLogin(app, password = 'pw123456') {
  const username = `user_${Date.now()}_${counter++}`;
  await request(app).post('/api/auth/register').send({ username, password });
  const res = await request(app).post('/api/auth/login').send({ username, password });
  return { token: res.body.token, username, password };
}

/** Authorization header helper. */
export const bearer = (token) => ({ Authorization: `Bearer ${token}` });
