// PWA : précache par le service worker, puis fonctionnement hors-ligne.
'use strict';

const { test, expect, ouvrirApp } = require('./aide');

test.use({ serviceWorkers: 'allow' });

test('hors-ligne après la première visite', async ({ page, context }) => {
  await ouvrirApp(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(async () => (await (await caches.open('conv-md-v1')).keys()).length >= 11);

  const cache = await page.evaluate(async () => (await (await caches.open('conv-md-v1')).keys()).map(r => r.url));
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

test('manifeste installable', async ({ page }) => {
  await ouvrirApp(page);
  const manifeste = await page.evaluate(async () => {
    const href = document.querySelector('link[rel=manifest]').href;
    return (await fetch(href)).json();
  });
  expect(manifeste).toMatchObject({ start_url: './', scope: './', display: 'standalone' });
  expect(manifeste.icons.length).toBeGreaterThan(0);
});
