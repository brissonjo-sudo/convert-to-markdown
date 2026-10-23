// Aperçu : rapide même pour les gros fichiers ; la copie porte sur tout le contenu.
'use strict';

const { test, expect, ouvrirApp } = require('./aide');

test.beforeEach(async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await ouvrirApp(page);
});

// Convertit un CSV de `n` lignes et renvoie la taille du Markdown produit.
async function convertirCsv(page, n) {
  return page.evaluate(async n => {
    const lignes = ['col1,col2,col3'];
    for (let i = 0; i < n; i++) lignes.push(`v${i},donnée ${i},${i}`);
    await traiterFichiers([Fab.texte('donnees.csv', lignes.join('\n'))]);
    return resultats[0].md.length;
  }, n);
}

test('gros fichier : aperçu tronqué, ouverture rapide, note affichée', async ({ page }) => {
  const taille = await convertirCsv(page, 100000);
  expect(taille).toBeGreaterThan(3_000_000);

  const duree = await page.evaluate(async () => {
    const t0 = performance.now();
    document.querySelector('.journal-actions-item button:nth-child(2)').click();   // « Aperçu »
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    return performance.now() - t0;
  });
  expect(duree).toBeLessThan(300);   // ≈ 1 500 ms avant correction

  await expect(page.locator('#apercu-note')).toBeVisible();
  await expect(page.locator('#apercu-note')).toContainText('premiers caractères');
  const affiche = await page.locator('#apercu-contenu').evaluate(el => el.textContent);
  expect(affiche.length).toBeLessThanOrEqual(100000);
  expect(affiche.endsWith('|')).toBe(true);   // coupé en fin de ligne
});

test('« Copier » copie le fichier complet, pas seulement l\'aperçu', async ({ page }) => {
  const taille = await convertirCsv(page, 100000);
  await page.locator('.journal-actions-item button', { hasText: 'Aperçu' }).click();
  await page.click('#btn-copier');
  await expect(page.locator('#btn-copier')).toHaveText('✅ Copié !');
  const copie = await page.evaluate(() => navigator.clipboard.readText());
  expect(copie.length).toBe(taille);
});

test('copie : repli quand l\'API presse-papiers est refusée', async ({ page }) => {
  await convertirCsv(page, 10);
  await page.evaluate(() => {
    navigator.clipboard.writeText = () => Promise.reject(new Error('refusé'));
  });
  await page.locator('.journal-actions-item button', { hasText: 'Aperçu' }).click();
  await page.click('#btn-copier');
  await expect(page.locator('#btn-copier')).toHaveText('✅ Copié !');
  const copie = await page.evaluate(() => navigator.clipboard.readText());
  expect(copie).toContain('| v9 | donnée 9 | 9 |');
});

test('petit fichier : aperçu complet, sans note', async ({ page }) => {
  await convertirCsv(page, 10);
  await page.locator('.journal-actions-item button', { hasText: 'Aperçu' }).click();
  await expect(page.locator('#apercu-overlay')).toBeVisible();
  await expect(page.locator('#apercu-note')).toBeHidden();
  await expect(page.locator('#apercu-contenu')).toContainText('| v9 | donnée 9 | 9 |');
});
