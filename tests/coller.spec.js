// Coller (Ctrl+V) : texte riche, texte brut ou fichiers du presse-papiers.
'use strict';

const { test, expect, ouvrirApp } = require('./aide');

test.beforeEach(async ({ page }) => { await ouvrirApp(page); });

// Simule un collage sur la page (ou dans l'élément ciblé)
async function coller(page, donnees, cible = 'body') {
  await page.evaluate(({ donnees, cible }) => {
    const dt = new DataTransfer();
    for (const [type, valeur] of Object.entries(donnees)) dt.setData(type, valeur);
    document.querySelector(cible).dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }));
  }, { donnees, cible });
}

test('texte riche (Word, page web) converti en Markdown', async ({ page }) => {
  await coller(page, { 'text/html': '<h2>Objet</h2><p>Texte <strong>gras</strong></p>', 'text/plain': 'Objet Texte gras' });
  await expect(page.locator('.journal-item')).toHaveClass(/ok/);
  const r = await page.evaluate(() => __resume());
  expect(r.resultats[0].nomMd).toBe('presse-papiers.md');
  expect(r.resultats[0].md).toContain('## Objet\n\nTexte **gras**');
});

test('texte brut, puis second collage : noms distincts', async ({ page }) => {
  await coller(page, { 'text/plain': 'Ligne 1\nLigne 2' });
  await expect(page.locator('.journal-item')).toHaveClass(/ok/);
  await coller(page, { 'text/plain': 'Autre' });
  await expect(page.locator('.journal-item.ok')).toHaveCount(2);
  const r = await page.evaluate(() => __resume());
  expect(r.resultats.map(x => x.nomMd)).toEqual(['presse-papiers.md', 'presse-papiers_2.md']);
  expect(r.resultats[0].md).toBe('# presse-papiers\n\nLigne 1\nLigne 2\n');
});

test('copie Excel ou Word (HTML + image de la sélection) : le HTML l\'emporte', async ({ page }) => {
  await page.evaluate(() => {
    const dt = new DataTransfer();
    dt.setData('text/html', '<table><tr><td>A</td><td>B</td></tr><tr><td>1</td><td>2</td></tr></table>');
    dt.items.add(new File([new Uint8Array([137, 80, 78, 71])], 'image.png', { type: 'image/png' }));
    document.body.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }));
  });
  await expect(page.locator('.journal-item')).toHaveClass(/ok/);
  const r = await page.evaluate(() => __resume());
  expect(r.resultats.map(x => x.nomMd)).toEqual(['presse-papiers.md']);
  expect(r.resultats[0].md).toContain('| A | B |');
});

test.describe('vrai Ctrl+V clavier', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('juste après avoir coché l\'en-tête Obsidian : le collage fonctionne', async ({ page }) => {
    await page.evaluate(() => navigator.clipboard.writeText('Bonjour'));
    await page.click('#opt-yaml');   // la case garde le focus
    await page.keyboard.press('Control+V');
    await expect(page.locator('.journal-item')).toHaveClass(/ok/);
  });
});

test('presse-papiers vide ou collage dans un champ : ignoré', async ({ page }) => {
  await coller(page, { 'text/plain': '   ' });
  await page.evaluate(() => document.body.appendChild(Object.assign(document.createElement('textarea'), { id: 'champ' })));
  await coller(page, { 'text/plain': 'saisie' }, '#champ');
  await expect(page.locator('#journal-section')).toBeHidden();
});
