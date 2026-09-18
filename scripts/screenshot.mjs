// Generates docs/screenshot.png for the README.
// Requires the app running locally (npm start). Usage: node scripts/screenshot.mjs
import { chromium } from '@playwright/test';

const base = process.env.BASE_URL || 'http://localhost:3000';
const creds = { username: `demo_${Date.now()}`, password: 'password123' };

await fetch(`${base}/api/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(creds),
});
const { token } = await (
  await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds),
  })
).json();
const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

const seed = [
  { title: 'Write TP-004 test plan', status: 'done' },
  { title: 'Automate checkout E2E flow', status: 'doing' },
  { title: 'Review API contract tests', status: 'todo' },
  { title: 'File bug: empty-cart checkout', status: 'todo' },
];
for (const t of seed)
  await fetch(`${base}/api/tasks`, { method: 'POST', headers: H, body: JSON.stringify(t) });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 560, height: 470 }, deviceScaleFactor: 2 });
await page.addInitScript((t) => localStorage.setItem('tf_token', t), token);
await page.goto(base);
await page.waitForSelector('[data-testid="task"]');
await page.screenshot({ path: 'docs/screenshot.png' });
await browser.close();
console.log('Saved docs/screenshot.png');
