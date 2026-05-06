import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  test('User can register and see dashboard', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[name="fullName"]', 'Test User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Meetings');
  });

  test('User can login with existing credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Meetings');
  });

  test('User sees error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpass');
    
    await page.click('button[type="submit"]');

    await expect(page.locator('.auth-error')).toBeVisible();
  });
});
