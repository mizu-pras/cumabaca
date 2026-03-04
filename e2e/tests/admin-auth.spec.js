import { test, expect } from '@playwright/test';

const ADMIN_URL = 'http://localhost:5174';

test.describe('Admin Auth', () => {
  test.use({ baseURL: ADMIN_URL });

  test('redirects to /login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page renders form fields', async ({ page }) => {
    await page.goto('/login');

    // Should have username and password inputs
    const usernameInput = page.getByLabel(/username/i).or(
      page.locator('input[name="username"], input[type="text"]').first()
    );
    const passwordInput = page.getByLabel(/password/i).or(
      page.locator('input[type="password"]').first()
    );

    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');

    const usernameInput = page.getByLabel(/username/i).or(
      page.locator('input[name="username"], input[type="text"]').first()
    );
    const passwordInput = page.getByLabel(/password/i).or(
      page.locator('input[type="password"]').first()
    );

    await usernameInput.fill('wronguser');
    await passwordInput.fill('wrongpass');

    const submitButton = page.getByRole('button', { name: /login|sign in|submit/i });
    await submitButton.click();

    // Should show an error message
    const error = page.getByText(/invalid|error|failed/i);
    await expect(error).toBeVisible({ timeout: 5000 });
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/login');

    const usernameInput = page.getByLabel(/username/i).or(
      page.locator('input[name="username"], input[type="text"]').first()
    );
    const passwordInput = page.getByLabel(/password/i).or(
      page.locator('input[type="password"]').first()
    );

    // Use test admin credentials (must exist in DB)
    await usernameInput.fill(process.env.ADMIN_USER || 'admin');
    await passwordInput.fill(process.env.ADMIN_PASS || 'admin');

    const submitButton = page.getByRole('button', { name: /login|sign in|submit/i });
    await submitButton.click();

    // Should redirect to dashboard on success
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });
});
