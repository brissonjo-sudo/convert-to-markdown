// PWA : précache par le service worker, puis fonctionnement hors-ligne.
'use strict';

const fs = require('fs');
const path = require('path');
const { test, expect, ouvrirApp } = require('./aide');

// Nom du cache lu dans sw.js : il change à chaque mise à jour de bibliothèque
const CACHE = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8').match(/const VERSION = '([^']+)'/)[1];

test.use({ serviceWorkers: 'allow' });

test('hors-ligne après la première visite', async ({ page, context }) => {
  await ouvrirApp(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(async c => (await (await caches.open(c)).keys()).length >= 11, CACHE);

  const cache = await page.evaluate(async c => (await (await caches.open(c)).keys()).map(r => r.url), CACHE);
  for (const attendu of ['/app/index.html', '/app/manifest.webmanifest', '/app/icone.svg',
    'xlsx.full.min.js', 'pdf.worker.min.js', 'mammoth.browser.min.js']) {
    expect(cache.some(u => u.endsWith(attendu)), `${attendu} en cache`).toBe(true);
  }

  await context.setOffline(true);
  await page.reload();
  await page.waitForFunction(() => window.XLSX && window.Papa && window.pdfjsLib && window.mammoth);
  const r = await page.evaluate(async () => {
    await traiterFichiers([Fab.texte('hors-ligne.csv', 'a,b\n1,2\n')]);
    return __resume();
  });
  expect(r.journal[0].statut).toBe('ok');
  expect(r.resultats[0].md).toContain('| 1 | 2 |');
});

test('une page d\'erreur visitée ne remplace pas l\'application hors-ligne', async ({ page, context }) => {
  await ouvrirApp(page);
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  const reponse = await page.goto('inexistant.html');   // 404, servie par le SW (réseau d'abord)
  expect(reponse.status()).toBe(404);

  await context.setOffline(true);
  await page.goto('index.html');
  await expect(page.locator('#zone-depot')).toBeVisible();
});

test('OCR disponible hors-ligne après un premier usage', async ({ page, context }) => {
  test.setTimeout(240_000);
  await ouvrirApp(page);
  await page.waitForFunction(() => navigator.serviceWorker.controller);   // requêtes servies par le SW

  const ocrUnScan = async () => {
    await page.evaluate(async () => traiterFichiers([await Fab.pdfScanne('scan.pdf', [['Bonjour Saint-Ouen']])]));
    await page.locator('.journal-actions-item button', { hasText: 'OCR' }).last().click();
    await expect(page.locator('.journal-item').last()).toHaveClass(/ok/, { timeout: 100_000 });
    return page.evaluate(() => resultats[resultats.length - 1].md);
  };

  expect(await ocrUnScan()).toContain('Bonjour Saint-Ouen');   // en ligne : fichiers OCR mis en cache
  const cache = await page.evaluate(async c => (await (await caches.open(c)).keys()).map(r => r.url), CACHE);
  for (const f of ['tesseract.min.js', 'worker.min.js', '.wasm.js']) {
    expect(cache.some(u => u.includes(f)), `${f} en cache`).toBe(true);
  }

  await context.setOffline(true);
  await page.reload();
  await page.waitForFunction(() => window.pdfjsLib && window.JSZip);
  expect(await ocrUnScan()).toContain('Bonjour Saint-Ouen');   // hors-ligne
});

test('manifeste installable', async ({ page }) => {
  await ouvrirApp(page);
  const manifeste = await page.evaluate(async () => {
    const href = document.querySelector('link[rel=manifest]').href;
    return (await fetch(href)).json();
  });
  expect(manifeste).toMatchObject({ start_url: './', scope: './', display: 'standalone' });
  expect(manifeste.icons.length).toBeGreaterThan(0);
});
