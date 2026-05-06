import { test, expect } from '@playwright/test';

test.describe('Meeting Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    // Using a known test user if possible, or we could rely on auth.spec.ts running first
    // For now, let's assume we need to login
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('User can create and join a meeting', async ({ page }) => {
    await page.click('button:has-text("Schedule New Meeting")');
    
    await page.fill('input[name="title"]', 'E2E Test Meeting');
    await page.fill('textarea[name="description"]', 'Testing meeting flow');
    
    await page.click('button[type="submit"]');

    // Wait for meeting card to appear
    await expect(page.locator('.meeting-card')).toContainText('E2E Test Meeting');
    
    // Join the meeting
    await page.click('.btn-primary:has-text("Join Now")');
    
    // Verify we are in the meeting room
    await expect(page).toHaveURL(/\/meeting\//);
    await expect(page.locator('.video-grid')).toBeVisible();
  });

  test('User can open chat and send a message', async ({ page }) => {
    // Find any meeting to join
    await page.click('.btn-primary:has-text("Join Now")');
    
    await page.click('button[title="Chat"]');
    await expect(page.locator('.chat-panel')).toBeVisible();
    
    await page.fill('.chat-input input', 'Hello from Playwright');
    await page.press('.chat-input input', 'Enter');
    
    await expect(page.locator('.message-text')).toContainText('Hello from Playwright');
  });
});
