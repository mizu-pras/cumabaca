import { test, expect } from '@playwright/test';

const ADMIN_URL = 'http://localhost:5174';

test.describe('Admin CRUD', () => {
  test.use({ baseURL: ADMIN_URL });

  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');

    const usernameInput = page.getByLabel(/username/i).or(
      page.locator('input[name="username"], input[type="text"]').first()
    );
    const passwordInput = page.getByLabel(/password/i).or(
      page.locator('input[type="password"]').first()
    );

    await usernameInput.fill(process.env.ADMIN_USER || 'admin');
    await passwordInput.fill(process.env.ADMIN_PASS || 'admin');

    const submitButton = page.getByRole('button', { name: /login|sign in|submit/i });
    await submitButton.click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });

  test('dashboard loads after login', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
    // Dashboard should show some content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('navigate to languages page', async ({ page }) => {
    const langLink = page.getByRole('link', { name: /languages/i });
    await langLink.click();

    await expect(page).toHaveURL(/\/languages/);
  });

  test('navigate to websites page', async ({ page }) => {
    const link = page.getByRole('link', { name: /websites/i });
    await link.click();

    await expect(page).toHaveURL(/\/websites/);
  });

  test('navigate to komiks page', async ({ page }) => {
    const link = page.getByRole('link', { name: /komiks/i });
    await link.click();

    await expect(page).toHaveURL(/\/komiks/);
  });

  test('create language flow', async ({ page }) => {
    await page.goto('/languages');

    // Click "New" or "Add" button
    const addButton = page.getByRole('link', { name: /new|add|create/i }).or(
      page.getByRole('button', { name: /new|add|create/i })
    );
    await addButton.click();

    await expect(page).toHaveURL(/\/languages\/new/);

    // Fill form
    const nameInput = page.getByLabel(/name/i).or(
      page.locator('input[name="name"]').first()
    );
    const codeInput = page.getByLabel(/code/i).or(
      page.locator('input[name="code"]').first()
    );

    const testCode = `e2e${Date.now()}`.slice(0, 10);
    await nameInput.fill('E2E Test Language');
    await codeInput.fill(testCode);

    // Submit
    const saveButton = page.getByRole('button', { name: /save|create|submit/i });
    await saveButton.click();

    // Should redirect back to languages list
    await expect(page).toHaveURL(/\/languages$/, { timeout: 5000 });
  });
});
