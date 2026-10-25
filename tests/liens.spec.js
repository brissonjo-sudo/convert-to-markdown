// Liens exécutables (javascript:, vbscript:, data:) : neutralisés dans le
// Markdown produit, qui peut être ouvert dans un éditeur où un clic les exécuterait.
'use strict';

const { test, expect, ouvrirApp } = require('./aide');

const DANGEREUX = /javascript|vbscript|data:/i;

test.beforeEach(async ({ page }) => { await ouvrirApp(page); });

test('HTML : texte du lien conservé, cible exécutable retirée', async ({ page }) => {
  const md = await page.evaluate(async () => {
    await traiterFichiers([Fab.texte('page.html',
      '<p><a href=" java&#9;script:alert(1)">clic</a> <a href="VBScript:x">vb</a> ' +
      '<a href="data:text/html,<script>alert(1)</script>">donnée</a> <a href="https://saint-ouen.fr">site</a> ' +
      '<img src="javascript:alert(2)" alt="piège"></p>')]);
    return __resume().resultats[0].md;
  });
  expect(md).toContain('clic');
  expect(md).toContain('[site](https://saint-ouen.fr)');
  expect(md).not.toMatch(DANGEREUX);
});

test('Word : liens du HTML produit par mammoth neutralisés', async ({ page }) => {
  const md = await page.evaluate(() =>
    notesWordEnMarkdown('<p><a href="javascript:alert(1)">clic</a> et <a href="https://saint-ouen.fr">site</a></p>', creerTurndown()));
  expect(md).toBe('clic et [site](https://saint-ouen.fr)');
});

test('ODT : lien et image externes exécutables neutralisés', async ({ page }) => {
  const md = await page.evaluate(async () => {
    await traiterFichiers([await Fab.odt('piege.odt',
      '<text:p><text:a xlink:href="javascript:alert(1)">clic</text:a> et <text:a xlink:href="https://saint-ouen.fr">site</text:a></text:p>' +
      '<text:p><draw:frame><draw:image xlink:href="javascript:alert(2)"/></draw:frame></text:p>', {})]);
    return __resume().resultats[0].md;
  });
  expect(md).toContain('clic et [site](https://saint-ouen.fr)');
  expect(md).not.toMatch(DANGEREUX);
});
