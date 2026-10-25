// OCR : PDF scanné (pages en image) → texte reconnu, sur l'appareil.
'use strict';

const fs = require('fs');
const { test, expect, ouvrirApp } = require('./aide');

test.setTimeout(180_000);

// Page 1 : titre, blanc, paragraphe sur deux lignes pleines, blanc, adresse en
// lignes courtes. Page 2 : article.
const PAGES = [
  ['Arrêté municipal numéro 42', '',
   'Le maire de la commune de Saint-Ouen arrête que le',
   'stationnement est interdit rue de la République.', '',
   'Mairie de Saint-Ouen', '6 place de la République', '93400 Saint-Ouen-sur-Seine'],
  ['Article 2', '', 'Fait à Saint-Ouen, le 12 mars 2026'],
];

// Sans accents ni casse, pour juger le texte reconnu sans exiger la perfection
const normaliser = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

async function deposerScan(page) {
  await ouvrirApp(page);
  await page.evaluate(async pages => traiterFichiers([await Fab.pdfScanne('arrete.pdf', pages)]), PAGES);
  await expect(page.locator('.journal-item')).toHaveClass(/warn/);
  return page.locator('.journal-actions-item button', { hasText: 'OCR' });
}

test('PDF scanné : texte reconnu par OCR, page par page', async ({ page }) => {
  const bouton = await deposerScan(page);
  await expect(bouton).toBeVisible();
  await bouton.click();
  await expect(page.locator('.journal-item')).toHaveClass(/ok/, { timeout: 150_000 });
  await expect(page.locator('.journal-msg')).toHaveText('Texte reconnu par OCR → arrete.md (à relire)');
  await expect(bouton).toHaveCount(0);

  const md = await page.evaluate(() => resultats[0].md);
  expect(md).toMatch(/^# arrete\n\n> Texte obtenu par reconnaissance optique \(OCR\), confiance moyenne \d+ %/);
  expect(md).toContain('*Page 1*');
  expect(md).toContain('---\n\n*Page 2*');
  // Structure reconstruite comme pour un PDF texte : titre isolé, paragraphe sur
  // deux lignes recollé, adresse ligne à ligne, article séparé par le blanc
  const texte = normaliser(md);
  expect(texte).toContain('*page 1*\n\narrete municipal numero 42\n\n' +
    'le maire de la commune de saint-ouen arrete que le stationnement est interdit rue de la republique.\n\n' +
    'mairie de saint-ouen\n6 place de la republique\n93400 saint-ouen-sur-seine\n\n---\n\n*page 2*\n\n' +
    'article 2\n\nfait a saint-ouen, le 12 mars 2026');

  // Télécharger livre le texte reconnu (et non plus l'avertissement de scan)
  const [dl] = await Promise.all([page.waitForEvent('download'),
    page.locator('.journal-actions-item button', { hasText: 'Télécharger' }).click()]);
  expect(normaliser(fs.readFileSync(await dl.path(), 'utf8'))).toContain('stationnement est interdit');
});

test('moteur OCR inaccessible : message clair, nouvel essai possible', async ({ page }) => {
  await page.route('**/tesseract.min.js', route => route.abort());
  const bouton = await deposerScan(page);
  await bouton.click();
  await expect(page.locator('.journal-msg')).toHaveText(/^OCR impossible : téléchargement du moteur impossible/);
  await expect(page.locator('.journal-item')).toHaveClass(/warn/);
  await expect(bouton).toBeEnabled();
  expect(await page.evaluate(() => resultats[0].md)).toContain('semble être un scan');
});
