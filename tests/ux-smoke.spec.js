const path = require('node:path');
const { test, expect } = require('@playwright/test');

const pages = [
  '/index.html',
  '/01-ellipse-reflection/index.html',
  '/02-ellipse-construction/index.html',
  '/03-eccentricity/index.html',
  '/04-parabola-reflection/index.html',
  '/05-hyperbola-reflection/index.html',
  '/06-conic-family/index.html'
];

for (const pagePath of pages) {
  test(`page loads cleanly: ${pagePath}`, async ({ page }) => {
    const issues = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') issues.push(`console:${msg.text()}`);
    });
    page.on('pageerror', (err) => issues.push(`pageerror:${err.message}`));

    await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();

    // Main pages should render either cards or canvas content.
    if (pagePath !== '/index.html') {
      await expect(page.locator('canvas')).toBeVisible();
      await expect(page.locator('.debug-panel')).toBeVisible();
    } else {
      await expect(page.locator('.nav-card')).toHaveCount(6);
    }

    const bad = issues.filter(
      (msg) =>
        msg.includes('CORS') ||
        msg.includes('ERR_FAILED') ||
        msg.includes('Failed to load module script') ||
        msg.includes('Uncaught')
    );
    expect(bad, `Unexpected errors on ${pagePath}:\n${bad.join('\n')}`).toEqual([]);
  });
}

test('P1 interaction updates URL state and toggles present mode', async ({ page }) => {
  await page.goto('/01-ellipse-reflection/index.html', { waitUntil: 'domcontentloaded' });

  const angleSlider = page.locator('#angleRange');
  await angleSlider.evaluate((el) => {
    el.value = '1.234';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await expect
    .poll(async () => {
      const u = new URL(page.url());
      return u.searchParams.get('theta');
    })
    .toBe('1.234');

  await page.locator('#presentBtn').click();
  await expect(page.locator('#explainCard')).toBeHidden();
});

test('debug snapshot button logs state to console', async ({ page }) => {
  const logs = [];
  page.on('console', (msg) => {
    logs.push(`${msg.type()}:${msg.text()}`);
  });

  await page.goto('/03-eccentricity/index.html?debug=1');
  const details = page.locator('.debug-panel');
  const isOpen = await details.evaluate((el) => el.hasAttribute('open'));
  if (!isOpen) {
    await page.locator('.debug-panel summary').click();
  }
  await page.getByRole('button', { name: 'Log state snapshot' }).click();

  await expect
    .poll(() => logs.some((line) => line.includes('STATE SNAPSHOT')))
    .toBeTruthy();
});

test('mobile layout still shows controls and canvas', async ({ page }) => {
  await page.goto('/04-parabola-reflection/index.html');
  await expect(page.locator('.canvas-wrap')).toBeVisible();
  await expect(page.locator('.controls')).toBeVisible();
});

test('file protocol shows clear startup warning instead of module CORS spam', async ({ page }) => {
  const errs = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errs.push(msg.text());
  });

  const localPath = path.resolve(process.cwd(), '01-ellipse-reflection', 'index.html');
  await page.goto(`file://${localPath}`);

  await expect(page.getByText('Local File Mode Detected')).toBeVisible();

  const corsErrors = errs.filter((line) => line.includes('Access to script at') || line.includes('CORS policy'));
  expect(corsErrors).toEqual([]);
});
