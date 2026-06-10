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
      await expect(page.locator('section', { has: page.getByRole('heading', { name: 'Suggested Sequence' }) }).locator('.nav-card')).toHaveCount(6);
      await expect(page.getByRole('link', { name: /Bonus\. Elliptical Pool Table/ })).toBeVisible();
    }

    const bad = issues.filter(
      (msg) =>
        msg.includes('CORS') ||
        msg.includes('ERR_FAILED') ||
        msg.includes('Failed to load module script') ||
        msg.includes('Uncaught') ||
        msg.includes('CHECK FAIL') ||
        msg.includes('Smoke test threw')
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
  await expect(page.locator('#presentBtn')).toHaveAttribute('aria-pressed', 'true');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#explainCard')).toBeHidden();
  await expect(page.locator('#presentBtn')).toHaveAttribute('aria-pressed', 'true');
});

test('interactive diagrams expose accessible names and live status', async ({ page }) => {
  for (const pagePath of pages.filter((p) => p !== '/index.html')) {
    await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('canvas[role="img"][aria-label]')).toBeVisible();
    await expect(page.locator('[role="status"][aria-live="polite"]').first()).toBeVisible();
  }
});

test('progress strip renders all modules from shared manifest', async ({ page }) => {
  await page.goto('/03-eccentricity/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.progress-strip .progress-dot')).toHaveCount(6);
  await expect(page.locator('.progress-strip [aria-current="page"]')).toHaveText('3');
  await expect(page.locator('.progress-strip .progress-label')).toContainText('Module 3 of 6');
});

test('canvas drag updates URL state on P1', async ({ page }) => {
  await page.goto('/01-ellipse-reflection/index.html', { waitUntil: 'domcontentloaded' });
  const before = new URL(page.url()).searchParams.get('theta');

  const box = await page.locator('#scene').boundingBox();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.25, { steps: 4 });
  await page.mouse.up();

  await expect
    .poll(async () => new URL(page.url()).searchParams.get('theta'))
    .not.toBe(before);
});

test('P6 sample point is draggable and persists theta', async ({ page }) => {
  await page.goto('/06-conic-family/index.html', { waitUntil: 'domcontentloaded' });

  const thetaSlider = page.locator('#thetaRange');
  await thetaSlider.evaluate((el) => {
    el.value = '1.5';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect
    .poll(async () => new URL(page.url()).searchParams.get('theta'))
    .toBe('1.500');

  const box = await page.locator('#scene').boundingBox();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.35, { steps: 4 });
  await page.mouse.up();

  await expect
    .poll(async () => new URL(page.url()).searchParams.get('theta'))
    .not.toBe('1.500');
});

test('keyboard reaches primary controls and updates URL state', async ({ page }) => {
  await page.goto('/06-conic-family/index.html', { waitUntil: 'domcontentloaded' });

  await page.locator('#eRange').focus();
  await page.keyboard.press('ArrowRight');

  await expect
    .poll(async () => new URL(page.url()).searchParams.get('e'))
    .not.toBeNull();

  await expect(page.locator('#typeLabel')).toContainText('Type:');
});

test('parabola mode toggle persists and exposes pressed state', async ({ page }) => {
  await page.goto('/04-parabola-reflection/index.html', { waitUntil: 'domcontentloaded' });

  const modeButton = page.locator('#modeBtn');
  await expect(modeButton).toHaveAttribute('aria-pressed', 'false');
  await modeButton.click();
  await expect(modeButton).toHaveAttribute('aria-pressed', 'true');
  await expect
    .poll(async () => new URL(page.url()).searchParams.get('mode'))
    .toBe('out');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#modeBtn')).toHaveAttribute('aria-pressed', 'true');
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

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
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
