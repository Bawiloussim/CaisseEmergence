import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[console:${type}] ${text}`);
    if (type === 'error') errors.push(text);
  });

  page.on('pageerror', err => {
    console.log('[pageerror]', err && err.message ? err.message : String(err));
    errors.push(err && err.message ? err.message : String(err));
  });

  const url = 'http://localhost:5173/';
  console.log('Visiting', url);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // capture a screenshot for inspection
  try {
    await page.screenshot({ path: 'headless_screenshot.png', fullPage: true });
    console.log('Screenshot saved: headless_screenshot.png');
  } catch (e) {
    console.warn('Screenshot failed:', e && e.message ? e.message : e);
  }

  await browser.close();

  if (errors.length) {
    console.error('Console errors detected:');
    errors.forEach((e, i) => console.error(`${i+1}: ${e}`));
    // eslint-disable-next-line no-undef
    process.exit(2);
  }

  console.log('No console errors detected.');
  // eslint-disable-next-line no-undef
  process.exit(0);
})();
