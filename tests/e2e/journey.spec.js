import { test, expect } from '@playwright/test';

/**
 * Milestone 5 — E2E user journeys against the real UI (Playwright drives Chromium).
 * Each test uses a unique username so runs are independent of the persistent e2e DB.
 */

const uniqueUser = () => `e2e_${Date.now()}_${Math.floor(Math.random() * 1e4)}`;

async function registerAndEnter(page) {
  const username = uniqueUser();
  await page.goto('/');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('pw123456');
  await page.getByTestId('register-btn').click();
  // register auto-logs-in → app view visible
  await expect(page.getByTestId('app-view')).toBeVisible();
  return username;
}

test('register → login → add task → complete → logout', async ({ page }) => {
  await registerAndEnter(page);

  // add a task
  await page.getByTestId('new-task-title').fill('Buy groceries');
  await page.getByTestId('add-task-btn').click();

  const task = page.getByTestId('task').filter({ hasText: 'Buy groceries' });
  await expect(task).toBeVisible();

  // complete it
  await task.getByTestId('toggle').check();
  await expect(task).toHaveClass(/done/);

  // logout returns to the auth view
  await page.getByTestId('logout-btn').click();
  await expect(page.getByTestId('auth-view')).toBeVisible();
});

test('invalid login shows an error', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('username').fill('nobody_here');
  await page.getByTestId('password').fill('wrongpass');
  await page.getByTestId('login-btn').click();
  await expect(page.getByTestId('auth-error')).toHaveText(/invalid credentials/i);
  await expect(page.getByTestId('app-view')).toBeHidden();
});

test('session persists across a page reload', async ({ page }) => {
  await registerAndEnter(page);
  await page.getByTestId('new-task-title').fill('Persist me');
  await page.getByTestId('add-task-btn').click();
  await expect(page.getByTestId('task').filter({ hasText: 'Persist me' })).toBeVisible();

  await page.reload();
  // still signed in (token in localStorage) and the task is still there
  await expect(page.getByTestId('app-view')).toBeVisible();
  await expect(page.getByTestId('task').filter({ hasText: 'Persist me' })).toBeVisible();
});

test('add two tasks then delete one', async ({ page }) => {
  await registerAndEnter(page);
  for (const title of ['Task one', 'Task two']) {
    await page.getByTestId('new-task-title').fill(title);
    await page.getByTestId('add-task-btn').click();
    await expect(page.getByTestId('task').filter({ hasText: title })).toBeVisible();
  }
  await expect(page.getByTestId('task')).toHaveCount(2);

  await page.getByTestId('task').filter({ hasText: 'Task one' }).getByTestId('delete').click();
  await expect(page.getByTestId('task')).toHaveCount(1);
  await expect(page.getByTestId('task').filter({ hasText: 'Task one' })).toHaveCount(0);
});
