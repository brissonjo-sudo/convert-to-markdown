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

test('PDF texte avec une page scannée : texte gardé, seule la page scannée passe à l\'OCR', async ({ page }) => {
  await ouvrirApp(page);
  await page.evaluate(async () => traiterFichiers([await Fab.pdfScanne('dossier.pdf', [
    { texte: [{ t: 'Rapport du service voirie', x: 72, y: 760 }, { t: 'Le budget est stable cette annee.', x: 72, y: 730 }] },
    ['Annexe signee', '', 'Le maire de Saint-Ouen'],
    { texte: [{ t: 'Conclusion du rapport.', x: 72, y: 760 }] },
    { texte: [] },   // page blanche : sans image, elle n'est pas un scan
  ])]));
  // Avant OCR : le texte des pages 1 et 3 est déjà là, la page 2 est signalée
  await expect(page.locator('.journal-item')).toHaveClass(/warn/);
  await expect(page.locator('.journal-msg')).toHaveText('Texte extrait. Page 2 scannée : lancez l\'OCR pour la reconnaître.');
  const avant = await page.evaluate(() => resultats[0].md);
  expect(avant).toContain('Le budget est stable cette annee.');
  expect(avant).toContain('> ⚠️ Page 2 : image sans texte (scan probable)');

  await page.locator('.journal-actions-item button', { hasText: 'OCR' }).click();
  await expect(page.locator('.journal-item')).toHaveClass(/ok/, { timeout: 150_000 });
  const md = await page.evaluate(() => resultats[0].md);
  expect(md).toMatch(/^# dossier\n\n> Page 2 : texte obtenu par reconnaissance optique \(OCR\), confiance moyenne \d+ %/);
  expect(md).not.toContain('scan probable');
  const texte = normaliser(md);
  // Ordre des pages conservé ; texte d'origine intact, page 2 reconnue (son texte,
  // plus gros que celui des pages 1 et 3, peut devenir titre : tailles comparées)
  expect(texte).toMatch(/\*page 1\*\n\nrapport du service voirie le budget est stable cette annee\.[\s\S]*\*page 2\*\n\n(#+ )?annexe signee[\s\S]*le maire de saint-ouen[\s\S]*\*page 3\*\n\nconclusion du rapport\./);
});

test('photo d\'un document : texte reconnu par OCR, à la demande', async ({ page }) => {
  await ouvrirApp(page);
  await page.evaluate(async () => traiterFichiers([await Fab.imageTexte('courrier.jpg',
    ['Mairie de Saint-Ouen', '', 'Objet : demande de stationnement'], 'image/jpeg')]));
  await expect(page.locator('.journal-item')).toHaveClass(/warn/);
  await expect(page.locator('.journal-msg')).toHaveText('Image : lancez l\'OCR pour reconnaître son texte.');

  await page.locator('.journal-actions-item button', { hasText: 'OCR' }).click();
  await expect(page.locator('.journal-item')).toHaveClass(/ok/, { timeout: 150_000 });
  const md = await page.evaluate(() => resultats[0].md);
  expect(md).toMatch(/^# courrier\n\n> Texte obtenu par reconnaissance optique/);
  expect(md).not.toContain('*Page 1*');   // une seule page : pas de repère
  // Deux lignes seulement : pas assez d'indices pour distinguer blanc et interligne
  expect(normaliser(md)).toMatch(/mairie de saint-ouen\n+objet : demande de stationnement/);
});

test('image illisible : message clair', async ({ page }) => {
  await ouvrirApp(page);
  await page.evaluate(() => traiterFichiers([Fab.texte('abime.png', 'pas une image')]));
  await page.locator('.journal-actions-item button', { hasText: 'OCR' }).click();
  await expect(page.locator('.journal-msg')).toHaveText('OCR impossible : image illisible', { timeout: 60_000 });
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
