// PDF : reconstruction des titres, paragraphes, listes ; en-têtes/pieds retirés.
'use strict';

const { test, expect, ouvrirApp } = require('./aide');

test.beforeEach(async ({ page }) => { await ouvrirApp(page); });

// Largeur d'un texte en Helvetica (métriques standard, millièmes de cadratin)
const LARGEURS = { B: 667, o: 556, n: 556, j: 222, u: 556, r: 333, L: 556, e: 556, ' ': 278, 1: 556 };
const largeur = (t, taille = 12) => [...t].reduce((s, c) => s + LARGEURS[c], 0) * taille / 1000;

async function convertirPdf(page, nom, pages) {
  return page.evaluate(async ({ nom, pages }) => {
    await traiterFichiers([Fab.pdf(nom, pages)]);
    return __resume().resultats[0].md;
  }, { nom, pages });
}

// Arrêté type : titre sur deux lignes, articles, paragraphes, listes, adresse.
const ARRETE = [[
  { t: 'Arrêté portant réglementation', x: 72, y: 780, taille: 18, gras: true },
  { t: 'du stationnement', x: 72, y: 758, taille: 18, gras: true },
  { t: 'Article 1', x: 72, y: 715, taille: 14, gras: true },
  { t: 'Le maire de la commune, vu le code général des collec-', x: 72, y: 690 },
  { t: 'tivités territoriales et vu le règlement du porte-', x: 72, y: 676 },
  { t: 'monnaie électronique, arrête les dispositions suivantes.', x: 72, y: 662 },
  { t: 'Un second paragraphe, séparé du premier par un blanc.', x: 72, y: 622 },
  { t: 'Article 2', x: 72, y: 580, taille: 14, gras: true },
  { t: '• premier point', x: 72, y: 555 },
  { t: '• second point qui se poursuit', x: 72, y: 541 },
  { t: 'sur une deuxième ligne', x: 84, y: 527 },
  { t: '1. élément numéroté', x: 72, y: 513 },
  { t: 'Mairie de Saint-Ouen', x: 72, y: 470 },
  { t: '6 place de la République', x: 72, y: 456 },
  { t: '93400 Saint-Ouen', x: 72, y: 442 },
]];

test('titres déduits de la taille de police, titre sur deux lignes fusionné', async ({ page }) => {
  const md = await convertirPdf(page, 'arrete.pdf', ARRETE);
  expect(md).toMatch(/^# arrete\n\n## Arrêté portant réglementation du stationnement\n\n### Article 1\n/);
  expect(md).toContain('\n### Article 2\n');
});

test('paragraphes reconstitués, césure en fin de ligne recollée', async ({ page }) => {
  const md = await convertirPdf(page, 'arrete.pdf', ARRETE);
  expect(md).toContain('Le maire de la commune, vu le code général des collec-tivités territoriales et vu le ' +
    'règlement du porte-monnaie électronique, arrête les dispositions suivantes.\n\nUn second paragraphe');
});

test('listes à puces et numérotées, suite de ligne en retrait rattachée', async ({ page }) => {
  const md = await convertirPdf(page, 'arrete.pdf', ARRETE);
  expect(md).toContain('- premier point\n- second point qui se poursuit sur une deuxième ligne\n\n1. élément numéroté');
});

test('lignes courtes (adresse) : retours à la ligne conservés', async ({ page }) => {
  const md = await convertirPdf(page, 'arrete.pdf', ARRETE);
  expect(md).toContain('Mairie de Saint-Ouen\n6 place de la République\n93400 Saint-Ouen');
});

test('document d\'une page : pas de repère de page', async ({ page }) => {
  const md = await convertirPdf(page, 'arrete.pdf', ARRETE);
  expect(md).not.toContain('*Page');
});

test('mot découpé en fragments recollé, espace réel conservé, exposant sur sa ligne', async ({ page }) => {
  const x2 = 72 + largeur('Bon');
  const x3 = x2 + largeur('jour') + 6;               // blanc de 6 pt avant « monde »
  const xEr = 72 + largeur('Le 1');
  const md = await convertirPdf(page, 'frag.pdf', [[
    { t: 'Bon', x: 72, y: 700 }, { t: 'jour', x: x2, y: 700 }, { t: 'monde', x: x3, y: 700 },
    { t: 'Le 1', x: 72, y: 650 }, { t: 'er', x: xEr, y: 654, taille: 8 },
    { t: ' janvier 2026', x: xEr + largeur('er', 8), y: 650 },
  ]]);
  expect(md).toContain('Bonjour monde');
  expect(md).toContain('Le 1er janvier 2026');
});

test('en-têtes et pieds de page répétés retirés, repères de page ajoutés', async ({ page }) => {
  const pages = [1, 2, 3].map(n => [
    { t: 'Ville de Saint-Ouen-sur-Seine', x: 72, y: 815, taille: 9 },
    { t: `Contenu de la page ${n}.`, x: 72, y: 600 },
    { t: `Page ${n} / 3`, x: 280, y: 25, taille: 9 },
  ]);
  pages[1].push({ t: 'Ville de Saint-Ouen-sur-Seine', x: 72, y: 400 });   // même texte, mais dans le corps
  const md = await convertirPdf(page, 'rapport.pdf', pages);
  expect(md).not.toMatch(/Page \d \/ 3/);
  expect(md.match(/Ville de Saint-Ouen-sur-Seine/g)).toHaveLength(1);   // seule l'occurrence du corps reste
  expect(md).toContain('*Page 1*\n\nContenu de la page 1.');
  expect(md).toContain('---\n\n*Page 3*\n\nContenu de la page 3.');
});

test('moins de 3 pages : en-têtes conservés (pas assez d\'indices de répétition)', async ({ page }) => {
  const pages = [1, 2].map(n => [
    { t: 'Ville de Saint-Ouen-sur-Seine', x: 72, y: 815, taille: 9 },
    { t: `Contenu ${n}.`, x: 72, y: 600 },
  ]);
  const md = await convertirPdf(page, 'court.pdf', pages);
  expect(md.match(/Ville de Saint-Ouen-sur-Seine/g)).toHaveLength(2);
});
