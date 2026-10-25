// index.html ouvert directement depuis le disque (file://), sans serveur : usage
// documenté dans le README. Origine « nulle », pas de service worker : la CSP,
// les workers blob: et la vérification d'intégrité doivent tout de même fonctionner.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { test, expect } = require('./aide');
const { fichierLocal, empreintesLocales, URL_CDN } = require('./serveur');

test('conversions fonctionnelles en file://, sous CSP et SRI', async ({ page }) => {
  // Copie d'index.html avec les empreintes des copies locales (les URLs restent
  // celles des CDN, interceptées ci-dessous et servies depuis node_modules)
  const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'conv-md-'));
  const fichier = path.join(dossier, 'index.html');
  fs.writeFileSync(fichier, empreintesLocales(fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8')));

  await page.route(url => URL_CDN.test(url.href), route => {
    const local = fichierLocal(route.request().url());
    if (!local || !fs.existsSync(local)) return route.abort();
    route.fulfill({ path: local, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'text/javascript' } });
  });
  await page.goto('file://' + fichier);
  await page.waitForFunction(() => window.mammoth && window.TurndownService && window.pdfjsLib && window.XLSX && window.Papa && window.JSZip);

  const r = await page.evaluate(async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Nom'], ['Alice']]), 'F');
    await traiterFichiers([
      Fab.texte('a.csv', 'x,y\n1,2\n'),
      await Fab.classeur('b.xlsx', wb),
      Fab.pdf('c.pdf', [[{ t: 'Arrêté municipal du maire', x: 72, y: 700 }]]),
      await Fab.docx('d.docx', Fab.docxPara('Titre', 'Heading1')),
      Fab.texte('e.html', '<h2>Page</h2><p>Texte</p>'),
    ]);
    return __resume();
  });
  expect(r.journal.map(j => `${j.nom}:${j.statut}`)).toEqual(['a.csv:ok', 'b.xlsx:ok', 'c.pdf:ok', 'd.docx:ok', 'e.html:ok']);
  expect(r.resultats.find(x => x.nom === 'c.pdf').md).toContain('Arrêté municipal du maire');
  expect(await page.evaluate(() => navigator.serviceWorker.controller)).toBeNull();
  fs.rmSync(dossier, { recursive: true, force: true });
});
