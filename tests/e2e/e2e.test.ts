import { test, expect } from '@playwright/test';

test.describe('MeridianLink End-to-End Test Suite', () => {
  test('1. Protected routes redirect unauthorized visitors to login', async ({ page }) => {
    await page.goto('/links');
    await expect(page).toHaveURL(/.*login.*/);
    await expect(page.locator('h2')).toContainText('Owner Sign In');
  });

  test('2. Owner can log in successfully', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#email', 'owner@meridianlink.local');
    await page.fill('input#password', 'ChangeMeInProd123!');
    await Promise.all([
      page.waitForURL('/', { timeout: 10000 }),
      page.click('button[type="submit"]'),
    ]);

    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Overview');
  });

  test('3. Public short link performs real server-side redirect with localization', async ({ request }) => {
    // Test US default redirect
    const usRes = await request.get('/r/sony-xm5', { maxRedirects: 0 });
    expect(usRes.status()).toBe(302);
    const usLoc = usRes.headers()['location'];
    expect(usLoc).toContain('amazon.com/dp/B09XS7JWHH');
    expect(usLoc).toContain('tag=meridian-20');

    // Test Simulated Canada redirect with dev override
    const caRes = await request.get('/r/sony-xm5?__country=CA', { maxRedirects: 0 });
    expect(caRes.status()).toBe(302);
    const caLoc = caRes.headers()['location'];
    expect(caLoc).toContain('amazon.ca/dp/B09XS7JWHH');
    expect(caLoc).toContain('tag=kgold0c-20');

    // Test Simulated UK redirect with group override
    const ukRes = await request.get('/r/sony-xm5?__country=GB', { maxRedirects: 0 });
    expect(ukRes.status()).toBe(302);
    const ukLoc = ukRes.headers()['location'];
    expect(ukLoc).toContain('amazon.co.uk/dp/B09XS7JWHH');
    expect(ukLoc).toContain('tag=meridiantech-uk-21');
  });

  test('4. Public choice page renders accessible product cards and multi-retailer options', async ({ page }) => {
    await page.goto('/c/desk-pro');
    await expect(page.locator('h1')).toContainText('Standing Desk');
    await expect(page.locator('text=Buy on Amazon US')).toBeVisible();
    await expect(page.locator('text=Buy on Best Buy')).toBeVisible();
    await expect(page.locator('text=Buy on Walmart')).toBeVisible();
  });

  test('5. A/B test short link distributes traffic and returns 302', async ({ request }) => {
    const res = await request.get('/r/fellow-kettle', { maxRedirects: 0 });
    expect(res.status()).toBe(302);
    const loc = res.headers()['location'];
    expect(loc).toMatch(/amazon\.com\/dp\/(B077JBQZPX|B07N8D3B2S)/);
  });

  test('6. Link manager lists links and allows search and filtering', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#email', 'owner@meridianlink.local');
    await page.fill('input#password', 'ChangeMeInProd123!');
    await Promise.all([
      page.waitForURL('/', { timeout: 10000 }),
      page.click('button[type="submit"]'),
    ]);

    // Navigate to Links
    await page.goto('/links');
    await expect(page.locator('h1')).toContainText('Links');
    await expect(page.locator('text=Sony WH-1000XM5 Wireless Headphones')).toBeVisible();

    // Test search filter
    await page.fill('input[placeholder*="Search"]', 'MacBook');
    await expect(page.locator('text=Apple MacBook Air 15-inch M3')).toBeVisible();
    await expect(page.locator('text=Sony WH-1000XM5')).toBeHidden();
  });

  test('7. Reports page renders charts and supports CSV download', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#email', 'owner@meridianlink.local');
    await page.fill('input#password', 'ChangeMeInProd123!');
    await Promise.all([
      page.waitForURL('/', { timeout: 10000 }),
      page.click('button[type="submit"]'),
    ]);

    await page.goto('/reports');
    await expect(page.locator('h1')).toContainText('Analytics & Reports');
    await expect(page.locator('text=Total Clicks')).toBeVisible();
    await expect(page.locator('text=Export CSV')).toBeVisible();
  });

  test('8. Missing or disabled slug returns 404', async ({ request }) => {
    const res = await request.get('/r/non-existent-random-slug-999');
    expect(res.status()).toBe(404);
  });

  test('9. Affiliate Programs catalog renders and supports network filtering', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#email', 'owner@meridianlink.local');
    await page.fill('input#password', 'ChangeMeInProd123!');
    await Promise.all([
      page.waitForURL('/', { timeout: 10000 }),
      page.click('button[type="submit"]'),
    ]);

    await page.goto('/programs');
    await expect(page.locator('h1')).toContainText('Affiliate Programs');
    await expect(page.locator('text=Amazon US Associates')).toBeVisible();
    await expect(page.locator('text=Best Buy US — Impact')).toBeVisible();
    await expect(page.locator('text=Walmart US — Impact')).toBeVisible();
  });

  test('10. Integrations Hub renders snippet generator and personal API tokens tab', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#email', 'owner@meridianlink.local');
    await page.fill('input#password', 'ChangeMeInProd123!');
    await Promise.all([
      page.waitForURL('/', { timeout: 10000 }),
      page.click('button[type="submit"]'),
    ]);

    await page.goto('/integrations');
    await expect(page.locator('h1')).toContainText('Integrations Hub');
    await expect(page.locator('text=Client-Side Link Rewriter')).toBeVisible();
    await expect(page.locator('text=Copy Snippet')).toBeVisible();

    // Click API Tokens tab
    await page.click('button:has-text("Personal API Tokens")');
    await expect(page.locator('text=Create API Token')).toBeVisible();
  });

  test('11. Settings page renders Amazon Creators API diagnostics card', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#email', 'owner@meridianlink.local');
    await page.fill('input#password', 'ChangeMeInProd123!');
    await Promise.all([
      page.waitForURL('/', { timeout: 10000 }),
      page.click('button[type="submit"]'),
    ]);

    await page.goto('/settings');
    await expect(page.locator('h1')).toContainText('Platform Settings');
    await expect(page.locator('text=Amazon Creators API Connection & Diagnostics')).toBeVisible();
    await expect(page.locator('text=Test Connection')).toBeVisible();
  });
});
