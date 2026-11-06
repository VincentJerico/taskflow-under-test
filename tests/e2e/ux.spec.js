import { test, expect } from '@playwright/test';

/**
 * UX behaviour on top of the core journeys: form submission, honest error messages, due dates,
 * editing, filtering, undo, and what happens when a save fails.
 */

const uniqueUser = () => `ux_${Date.now()}_${Math.floor(Math.random() * 1e4)}`;
const PASSWORD = 'pw123456';

async function registerAndEnter(page) {
  const username = uniqueUser();
  await page.goto('/');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill(PASSWORD);
  await page.getByTestId('register-btn').click();
  await expect(page.getByTestId('app-view')).toBeVisible();
  return username;
}

async function addTask(page, title, dueDate) {
  await page.getByTestId('new-task-title').fill(title);
  if (dueDate) await page.getByTestId('new-task-due').fill(dueDate);
  await page.getByTestId('add-task-btn').click();
  await expect(page.getByTestId('task').filter({ hasText: title })).toBeVisible();
}

const taskRow = (page, title) => page.getByTestId('task').filter({ hasText: title });

/** The task as the server stored it, looked up by title. */
async function storedTask(page, title) {
  const token = await page.evaluate(() => localStorage.getItem('tf_token'));
  const res = await page.request.get('/api/tasks', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return (await res.json()).find((t) => t.title === title);
}

/** A YYYY-MM-DD date `days` from today, in the browser's local time zone. */
function isoDaysFromToday(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

test.describe('signing in', () => {
  test('pressing Enter in the password field logs in', async ({ page, request }) => {
    const username = uniqueUser();
    await request.post('/api/auth/register', { data: { username, password: PASSWORD } });

    await page.goto('/');
    await page.getByTestId('username').fill(username);
    await page.getByTestId('password').fill(PASSWORD);
    await page.getByTestId('password').press('Enter');

    await expect(page.getByTestId('app-view')).toBeVisible();
  });

  test('empty fields are caught before anything is sent', async ({ page }) => {
    let authRequests = 0;
    page.on('request', (r) => r.url().includes('/api/auth/') && authRequests++);

    await page.goto('/');
    await page.getByTestId('login-btn').click();

    await expect(page.getByTestId('auth-error')).toHaveText('Enter a username and password.');
    expect(authRequests).toBe(0);
  });

  test('a rate-limited login says so, instead of "invalid credentials"', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: 429,
        headers: { 'Retry-After': '42' },
        contentType: 'application/json',
        body: JSON.stringify({ error: 'too many requests, try again later' }),
      }),
    );

    await page.goto('/');
    await page.getByTestId('username').fill('someone');
    await page.getByTestId('password').fill('whatever');
    await page.getByTestId('login-btn').click();

    await expect(page.getByTestId('auth-error')).toHaveText(
      'Too many attempts. Try again in 42 seconds.',
    );
  });

  test('the signed-in username is still shown after a reload', async ({ page }) => {
    const username = await registerAndEnter(page);
    await page.reload();
    await expect(page.getByTestId('whoami')).toHaveText(`Signed in as ${username}`);
  });
});

test.describe('working with tasks', () => {
  test('a task can have a due date, and an overdue one is flagged', async ({ page }) => {
    await registerAndEnter(page);
    await addTask(page, 'Renew passport', isoDaysFromToday(-3));
    await addTask(page, 'Book flights', isoDaysFromToday(10));
    await addTask(page, 'No deadline');

    await expect(taskRow(page, 'Renew passport').getByTestId('task-due')).toContainText('Overdue');
    await expect(taskRow(page, 'Book flights').getByTestId('task-due')).toContainText('Due');
    await expect(taskRow(page, 'Book flights').getByTestId('task-due')).not.toContainText(
      'Overdue',
    );
    await expect(taskRow(page, 'No deadline').getByTestId('task-due')).toHaveCount(0);
    expect((await storedTask(page, 'Book flights')).due_date).toBe(isoDaysFromToday(10));

    // A finished task is no longer overdue.
    await taskRow(page, 'Renew passport').getByTestId('toggle').check();
    await expect(taskRow(page, 'Renew passport').getByTestId('task-due')).not.toContainText(
      'Overdue',
    );
  });

  test('a title can be edited in place: Enter saves, Escape cancels', async ({ page }) => {
    await registerAndEnter(page);
    await addTask(page, 'Draft test plan');

    await taskRow(page, 'Draft test plan').getByTestId('edit').click();
    await page.getByTestId('edit-title').fill('Draft test plan for checkout');
    await page.getByTestId('edit-title').press('Enter');
    await expect(page.getByTestId('task-title')).toHaveText('Draft test plan for checkout');
    expect(await storedTask(page, 'Draft test plan for checkout')).toBeTruthy();

    await taskRow(page, 'Draft test plan for checkout').getByTestId('edit').click();
    await page.getByTestId('edit-title').fill('Something else');
    await page.getByTestId('edit-title').press('Escape');
    await expect(page.getByTestId('task-title')).toHaveText('Draft test plan for checkout');
    // Focus goes back to the Edit button, not the page body.
    await expect(taskRow(page, 'Draft test plan for checkout').getByTestId('edit')).toBeFocused();
  });

  test('the filter shows only to-do or only done tasks', async ({ page }) => {
    await registerAndEnter(page);
    for (const title of ['One', 'Two', 'Three']) await addTask(page, title);
    await taskRow(page, 'Two').getByTestId('toggle').check();
    await expect(taskRow(page, 'Two')).toHaveClass(/done/);

    await page.getByTestId('filter-todo').click();
    await expect(page.getByTestId('filter-todo')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('task-title')).toHaveText(['One', 'Three']);

    await page.getByTestId('filter-done').click();
    await expect(page.getByTestId('task-title')).toHaveText(['Two']);

    await page.getByTestId('filter-all').click();
    await expect(page.getByTestId('task-title')).toHaveText(['One', 'Two', 'Three']);
  });

  test('a deleted task can be brought back with Undo', async ({ page }) => {
    await registerAndEnter(page);
    await addTask(page, 'Keep me', isoDaysFromToday(5));

    await taskRow(page, 'Keep me').getByTestId('delete').click();
    await expect(page.getByTestId('task')).toHaveCount(0);
    await expect(page.getByTestId('toast')).toContainText('Task deleted');

    await page.getByTestId('undo').click();
    await expect(taskRow(page, 'Keep me')).toBeVisible();
    expect((await storedTask(page, 'Keep me')).due_date).toBe(isoDaysFromToday(5));
  });

  test('a failed save keeps what you typed and says what went wrong', async ({ page }) => {
    await registerAndEnter(page);
    await page.route('**/api/tasks', (route) =>
      route.request().method() === 'POST'
        ? route.fulfill({ status: 500, body: 'boom' })
        : route.continue(),
    );

    await page.getByTestId('new-task-title').fill('Do not lose me');
    await page.getByTestId('add-task-btn').click();

    await expect(page.getByTestId('toast')).toContainText("Couldn't add the task");
    await expect(page.getByTestId('new-task-title')).toHaveValue('Do not lose me');
    await expect(page.getByTestId('task')).toHaveCount(0);
  });
});
