import { chromium } from 'playwright';

async function findBaseUrl(page) {
  const ports = [5173, 5174, 5175, 5176, 5177, 5178, 5179, 5180];
  for (const port of ports) {
    try {
      const url = `http://localhost:${port}`;
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 3000 });
      if (resp && resp.ok()) return url;
    } catch (e) {
      // try next
    }
  }
  return null;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const base = await findBaseUrl(page);
  if (!base) {
    console.error('Aucun serveur local trouvé sur ports 5173/5174/5175');
    await browser.close();
    process.exit(2);
  }

  console.log('Page trouvée:', base);

  try {
    await page.goto(base, { waitUntil: 'networkidle', timeout: 10000 });

    // navigate to the Reports tab via navigation
    const navBtn = page.locator('button', { hasText: 'Rapports' });
    await navBtn.waitFor({ timeout: 5000 });
    await navBtn.click();

    // find the report card by title and click its button
    const titleLocator = page.locator('h4', { hasText: 'Formulaire contrat prêt' });
    await titleLocator.waitFor({ timeout: 5000 });
    const parent = titleLocator.locator('..');
    const btn = parent.locator('button');
    await btn.click();
    console.log('Clic sur la carte — ouverture modal demandée');

    // wait for modal title
    const modalTitle = page.locator('text=Formulaire prêt — Préremplir');
    await modalTitle.waitFor({ timeout: 5000 });
    console.log('Modal ouverte');

    // click close
    const closeBtn = page.locator('button[aria-label="Fermer"]');
    await closeBtn.click();
    console.log('Clic sur fermer');

    // small wait for DOM update
    await page.waitForTimeout(300);

    const activeText = await page.evaluate(() => document.activeElement ? document.activeElement.textContent?.trim() : null);
    console.log('Élément actif après fermeture:', activeText);

    const ok = activeText && activeText.includes('Télécharger PDF');
    console.log(ok ? 'FOCUS RESTAURÉ ✔' : 'FOCUS NON RESTAURÉ ✖');

    await browser.close();
    process.exit(ok ? 0 : 5);
  } catch (err) {
    console.error('Erreur pendant le test:', err);
    await browser.close();
    process.exit(3);
  }
})();
