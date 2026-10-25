// En-tête YAML (propriétés Obsidian) : ajouté à l'export quand la case est cochée.
'use strict';

const fs = require('fs');
const JSZip = require('jszip');
const { test, expect, ouvrirApp } = require('./aide');

// Nom piège pour le YAML (« : » et guillemets) : doit rester une chaîne valide
const ENTETE = /^---\ntitle: "note: v2 \\"final\\""\nsource: "note: v2 \\"final\\".txt"\ndate: \d{4}-\d{2}-\d{2}\n---\n\n# note: v2 "final"\n/;

async function convertir(page) {
  await page.evaluate(async () => traiterFichiers([Fab.texte('note: v2 "final".txt', 'Bonjour'), Fab.texte('b.csv', 'x\n1\n')]));
  await expect(page.locator('.journal-item.ok')).toHaveCount(2);
}

const telecharger = async (page, bouton) => {
  const [dl] = await Promise.all([page.waitForEvent('download'), bouton.click()]);
  return fs.readFileSync(await dl.path());
};

test('case cochée (même après conversion) : en-tête dans le .md, l\'aperçu et le ZIP', async ({ page }) => {
  await ouvrirApp(page);
  await convertir(page);
  await page.check('#opt-yaml');

  const md = (await telecharger(page, page.locator('.journal-actions-item button', { hasText: 'Télécharger' }).first())).toString('utf8');
  expect(md).toMatch(ENTETE);
  expect(md.endsWith('Bonjour\n')).toBe(true);

  await page.locator('.journal-actions-item button', { hasText: 'Aperçu' }).first().click();
  await expect(page.locator('#apercu-contenu')).toContainText('title: "note: v2');
  await page.click('#btn-fermer-apercu');

  const zip = await JSZip.loadAsync(await telecharger(page, page.locator('#btn-zip')));
  expect(await zip.file('note: v2 "final".md').async('string')).toMatch(ENTETE);
  expect(await zip.file('b.md').async('string')).toMatch(/^---\ntitle: "b"\nsource: "b.csv"\n/);
});

test('case décochée : Markdown inchangé ; choix mémorisé', async ({ page }) => {
  await ouvrirApp(page);
  await expect(page.locator('#opt-yaml')).not.toBeChecked();
  await convertir(page);
  const md = (await telecharger(page, page.locator('.journal-actions-item button', { hasText: 'Télécharger' }).first())).toString('utf8');
  expect(md).toBe('# note: v2 "final"\n\nBonjour\n');

  await page.check('#opt-yaml');
  await page.reload();
  await expect(page.locator('#opt-yaml')).toBeChecked();
});
