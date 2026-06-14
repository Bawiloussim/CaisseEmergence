import { chromium } from 'playwright';

try {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const ports = [5175, 5174, 5173];
  let opened = false;
  for (const p of ports) {
    const url = `http://localhost:${p}/`;
    try {
      console.log('Trying', url);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 3000 });
      opened = true;
      break;
    } catch (err) {
      // try next
    }
  }
  if (!opened) throw new Error('Could not reach dev server on ports ' + ports.join(', '));

  // Go to Prêts
  await page.waitForSelector('text=Prêts');
  await page.click('text=Prêts');
  await page.waitForTimeout(500);

  // Ensure there's a loan request; if none, create one (Secretary assumed)
  const noLoans = await page.$('text=Aucun prêt enregistré');
  if (noLoans) {
    // click new request
    await page.click('text=Nouvelle demande de prêt');
    await page.waitForSelector('form');
    // select first member
    await page.selectOption('select[name="memberId"]', { index: 1 });
    await page.fill('input[name="amount"]', '50000');
    await page.fill('input[name="motif"]', 'Test automatisé');
    // submitting the form triggers a PDF download in the app; wait for it
    try {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 5000 }),
        page.click('text=Enregistrer la demande')
      ]);
      const path = await download.path();
      console.log('Downloaded contract PDF to', path);
    } catch (err) {
      // if no download event, still continue
      await page.click('text=Enregistrer la demande');
    }
    await page.waitForTimeout(500);
  }

  // Wait for the table rows to appear and target the first row's visible status cell
  await page.waitForSelector('table tbody tr');

  // Cast votes until the loan is approved or we've tried enough times
  const firstRow = await page.$('table tbody tr:first-child');
  if (firstRow) {
    // helper to read status text from the visible status cell (9th column)
    const getStatus = async () => {
      try {
        const txt = await firstRow.$eval('td:nth-child(9)', el => el.innerText.trim());
        return txt;
      } catch (e) {
        return '';
      }
    };

    let status = await getStatus();
    let attempts = 0;
    while (!status.includes('Approuvé') && attempts < 6) {
      const voteSelect = await firstRow.$('select');
      if (!voteSelect) break;
      // select next available voter by index (1..)
      await voteSelect.selectOption({ index: (attempts % 6) + 1 }).catch(() => {});
      // click Oui button within the same row
      const yesButton = await firstRow.$('button:has-text("Oui")');
      if (yesButton) await yesButton.click().catch(() => {});
      await page.waitForTimeout(500);
      status = await getStatus();
      attempts++;
    }
    // wait briefly for approval badge to render
    await page.waitForTimeout(500);
  }

  // Click Contrat PDF
  // Try to generate/download contract: prefer explicit 'Contrat PDF', fallback to 'Générer contrat'
  const pdfButton = await page.$('text=Contrat PDF') || await page.$('text=Générer contrat');
  if (pdfButton) {
    try {
      const [ download ] = await Promise.all([
        page.waitForEvent('download', { timeout: 5000 }),
        pdfButton.click()
      ]);
      const path = await download.path();
      console.log('Downloaded PDF to', path);
    } catch (err) {
      console.warn('No download detected after clicking contract button');
    }
  } else {
    console.warn('No PDF button found');
  }

  await browser.close();
  console.log('Test finished');
} catch (err) {
  console.error('Test failed:', err.message || err);
  process.exit(1);
}
