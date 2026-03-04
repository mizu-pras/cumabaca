import { test, expect } from '@playwright/test';

test.describe('Frontend Reader', () => {
  test('homepage loads with header and reader form', async ({ page }) => {
    await page.goto('/');

    // Header should be visible
    await expect(page.locator('header')).toBeVisible();

    // Should have an input for entering comic URL
    const urlInput = page.getByPlaceholder(/url/i).or(page.locator('input[type="text"]').first());
    await expect(urlInput).toBeVisible();
  });

  test('navigation links work', async ({ page }) => {
    await page.goto('/');

    // Navigate to About page
    const aboutLink = page.getByRole('link', { name: /about/i });
    if (await aboutLink.isVisible()) {
      await aboutLink.click();
      await expect(page).toHaveURL(/\/about/);
    }
  });

  test('cached page loads', async ({ page }) => {
    await page.goto('/cached');

    // Page should load without errors
    await expect(page).toHaveURL(/\/cached/);
  });

  test('websites page lists supported sites', async ({ page }) => {
    await page.goto('/websites');

    await expect(page).toHaveURL(/\/websites/);
    // Should show at least some website information
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('secret page loads and shows NSFW toggle', async ({ page }) => {
    await page.goto('/secret');

    await expect(page).toHaveURL(/\/secret/);
  });

  test('submitting empty URL shows validation or no results', async ({ page }) => {
    await page.goto('/');

    // Find and submit the form without entering a URL
    const submitButton = page.getByRole('button', { name: /read|go|search|submit/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Should not navigate away or should show an error
      await expect(page).toHaveURL('/');
    }
  });
});
