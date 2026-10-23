// Images : extraites en fichiers (plus de base64 dans le Markdown), livrées en ZIP.
'use strict';

const fs = require('fs');
const JSZip = require('jszip');
const { test, expect, ouvrirApp } = require('./aide');

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

test.beforeEach(async ({ page }) => { await ouvrirApp(page); });

// Document Word avec deux images (la première avec un texte alternatif).
async function convertirDocx(page, noms) {
  return page.evaluate(async noms => {
    const corps = Fab.docxPara('Rapport annuel', 'Heading1') + Fab.docxImage('rIdA', 'Logo de la ville') +
                  Fab.docxPara('Texte entre les images.') + Fab.docxImage('rIdB');
    const fichiers = [];
    for (const nom of noms) fichiers.push(await Fab.docx(nom, corps, { rIdA: Fab.PNG_B64, rIdB: Fab.PNG_B64 }));
    await traiterFichiers(fichiers);
    return __resume();
  }, noms);
}

async function telecharger(page, declencheur) {
  const [dl] = await Promise.all([page.waitForEvent('download'), declencheur()]);
  return { nom: dl.suggestedFilename(), zip: await JSZip.loadAsync(fs.readFileSync(await dl.path())) };
}

test('Word : images extraites, liens relatifs, plus de base64', async ({ page }) => {
  const r = await convertirDocx(page, ['rapport.docx']);
  const { md, images } = r.resultats[0];
  expect(md).toContain('![Logo de la ville](images/rapport/image1.png)');
  expect(md).toContain('![](images/rapport/image2.png)');
  expect(md).not.toContain('base64');
  expect(md.indexOf('image1')).toBeLessThan(md.indexOf('Texte entre')); // ordre du document
  expect(images).toEqual([
    { chemin: 'images/rapport/image1.png', octets: PNG.length },
    { chemin: 'images/rapport/image2.png', octets: PNG.length },
  ]);
  expect(r.journal[0].msg).toBe('Converti → rapport.md (+ 2 images)');
});

test('Télécharger un document avec images livre un ZIP complet', async ({ page }) => {
  await convertirDocx(page, ['rapport.docx']);
  const bouton = page.locator('.journal-actions-item button').first();
  await expect(bouton).toHaveText('⬇️ Télécharger (.zip)');
  const { nom, zip } = await telecharger(page, () => bouton.click());
  expect(nom).toBe('rapport.zip');
  expect(Object.keys(zip.files).filter(f => !f.endsWith('/')).sort())
    .toEqual(['images/rapport/image1.png', 'images/rapport/image2.png', 'rapport.md']);
  expect(Buffer.from(await zip.file('images/rapport/image1.png').async('uint8array'))).toEqual(PNG);
});

test('ZIP global : homonymes séparés, chaque .md pointe vers son dossier', async ({ page }) => {
  await convertirDocx(page, ['rapport.docx', 'rapport.docx']);
  const { zip } = await telecharger(page, () => page.click('#btn-zip'));
  const fichiers = Object.keys(zip.files).filter(f => !f.endsWith('/')).sort();
  expect(fichiers).toEqual([
    'images/rapport/image1.png', 'images/rapport/image2.png',
    'images/rapport_2/image1.png', 'images/rapport_2/image2.png',
    'rapport.md', 'rapport_2.md',
  ]);
  expect(await zip.file('rapport_2.md').async('string')).toContain('(images/rapport_2/image1.png)');
});

test('nom avec espaces et parenthèses : lien Markdown valide', async ({ page }) => {
  const r = await convertirDocx(page, ['Arrêté (copie) 2025.docx']);
  expect(r.resultats[0].nomMd).toBe('Arrêté (copie) 2025.md');
  expect(r.resultats[0].md).toContain('(images/Arrêté-copie-2025/image1.png)');
});

test('HTML : images base64 extraites, images distantes conservées', async ({ page }) => {
  const r = await page.evaluate(async png => {
    await traiterFichiers([Fab.texte('page.html',
      `<body><p>Intro</p><img alt="Plan" src="data:image/png;base64,${png}"><img alt="Logo" src="https://exemple.fr/logo.png"></body>`)]);
    return __resume();
  }, PNG.toString('base64'));
  const { md, images } = r.resultats[0];
  expect(md).toContain('![Plan](images/page/image1.png)');
  expect(md).toContain('![Logo](https://exemple.fr/logo.png)');
  expect(md).not.toContain('base64');
  expect(images).toEqual([{ chemin: 'images/page/image1.png', octets: PNG.length }]);
});

test('sans image : téléchargement du .md seul', async ({ page }) => {
  await page.evaluate(() => traiterFichiers([Fab.texte('note.txt', 'Bonjour')]));
  const bouton = page.locator('.journal-actions-item button').first();
  await expect(bouton).toHaveText('⬇️ Télécharger');
  const [dl] = await Promise.all([page.waitForEvent('download'), bouton.click()]);
  expect(dl.suggestedFilename()).toBe('note.md');
});

test('noms uniques sans tenir compte de la casse, remis à zéro par « Vider »', async ({ page }) => {
  let r = await page.evaluate(async () => {
    await traiterFichiers([Fab.texte('Rapport.txt', 'a'), Fab.texte('rapport.csv', 'x\n1\n')]);
    return __resume();
  });
  expect(r.resultats.map(x => x.nomMd).sort()).toEqual(['Rapport.md', 'rapport_2.md']);

  await page.click('#btn-vider');
  r = await page.evaluate(async () => { await traiterFichiers([Fab.texte('rapport.txt', 'b')]); return __resume(); });
  expect(r.resultats[0].nomMd).toBe('rapport.md');
});

test('un échec de conversion libère le nom réservé', async ({ page }) => {
  const r = await page.evaluate(async () => {
    await traiterFichiers([Fab.texte('rapport.pptx', 'pas un zip')]);
    await traiterFichiers([Fab.texte('rapport.txt', 'ok')]);
    return __resume();
  });
  expect(r.resultats[0].nomMd).toBe('rapport.md');
});
