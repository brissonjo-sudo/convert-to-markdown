// Conversion de chaque format + comportement du journal et du ZIP.
'use strict';

const fs = require('fs');
const JSZip = require('jszip');
const { test, expect, ouvrirApp } = require('./aide');

test.beforeEach(async ({ page }) => { await ouvrirApp(page); });

// Convertit les fichiers produits par `fabrique` (exécutée dans la page) et
// renvoie le résumé journal + résultats.
async function convertir(page, fabrique, arg) {
  return page.evaluate(async ({ src, arg }) => {
    const fichiers = await (0, eval)('(' + src + ')')(arg);
    await traiterFichiers(fichiers);
    return __resume();
  }, { src: fabrique.toString(), arg });
}

test.describe('CSV / TSV', () => {
  test('virgule, tableau Markdown', async ({ page }) => {
    const r = await convertir(page, () => [Fab.texte('ventes.csv', 'a,b,c\n1,2,3\n4,5,6\n')]);
    expect(r.resultats[0].md).toBe('# ventes\n\n| a | b | c |\n| --- | --- | --- |\n| 1 | 2 | 3 |\n| 4 | 5 | 6 |\n');
  });

  test('point-virgule détecté automatiquement (export Excel français)', async ({ page }) => {
    const r = await convertir(page, () => [Fab.texte('fr.csv', 'nom;ville\nDupont;Saint-Ouen\n')]);
    expect(r.resultats[0].md).toContain('| Dupont | Saint-Ouen |');
  });

  test('TSV', async ({ page }) => {
    const r = await convertir(page, () => [Fab.texte('t.tsv', 'x\ty\n1\t2\n')]);
    expect(r.resultats[0].md).toContain('| 1 | 2 |');
  });

  test('barres verticales échappées et retours à la ligne en <br>', async ({ page }) => {
    const r = await convertir(page, () => [Fab.texte('e.csv', 'a,b\n"x|y","l1\nl2"\n')]);
    expect(r.resultats[0].md).toContain('| x\\|y | l1<br>l2 |');
  });

  test('encodage Windows-1252 et UTF-8 avec BOM', async ({ page }) => {
    const r = await convertir(page, () => [
      Fab.texte('w.csv', 'commune\nÉpinay\n', 'windows-1252'),
      Fab.texte('b.csv', 'commune\nÉpinay\n', 'utf-8-bom'),
    ]);
    for (const res of r.resultats) expect(res.md).toContain('| Épinay |');
  });
});

test('TXT : titre + contenu', async ({ page }) => {
  const r = await convertir(page, () => [Fab.texte('note.txt', '  Bonjour\nLigne 2  \n', 'windows-1252')]);
  expect(r.resultats[0].md).toBe('# note\n\nBonjour\nLigne 2\n');
});

test('HTML : titres et tableaux convertis, scripts et styles retirés', async ({ page }) => {
  const r = await convertir(page, () => [Fab.texte('page.html',
    '<html><head><style>p{color:red}</style></head><body><h1>Titre</h1><script>alert(1)</script>' +
    '<p>Texte <strong>gras</strong></p><table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table></body></html>')]);
  const md = r.resultats[0].md;
  expect(md).toContain('# Titre');
  expect(md).toContain('Texte **gras**');
  expect(md).toContain('| A | B |\n| --- | --- |\n| 1 | 2 |');
  expect(md).not.toMatch(/alert|color:red/);
});

test('DOCX : titres et paragraphes', async ({ page }) => {
  const r = await convertir(page, async () => [await Fab.docx('rapport.docx',
    Fab.docxPara('Introduction', 'Heading1') + Fab.docxPara('Premier paragraphe.'))]);
  expect(r.journal[0].statut).toBe('ok');
  expect(r.resultats[0].md).toContain('# Introduction');
  expect(r.resultats[0].md).toContain('Premier paragraphe.');
});

test.describe('PDF', () => {
  test('texte extrait page par page', async ({ page }) => {
    const r = await convertir(page, () => [Fab.pdf('arrete.pdf', [
      [{ t: 'Arrêté municipal n° 42', x: 72, y: 760 }],
      [{ t: 'Article 2 – dispositions', x: 72, y: 760 }],
    ])]);
    const md = r.resultats[0].md;
    expect(r.journal[0].statut).toBe('ok');
    expect(md).toMatch(/^# arrete\n/);
    expect(md).toContain('Arrêté municipal n° 42');
    expect(md).toContain('Article 2 – dispositions');
    expect(md.indexOf('Arrêté')).toBeLessThan(md.indexOf('Article 2'));
  });

  test('PDF scanné (sans texte) signalé', async ({ page }) => {
    const r = await convertir(page, () => [Fab.pdf('scan.pdf', [[]])]);
    expect(r.journal[0].statut).toBe('warn');
    expect(r.resultats[0].md).toContain('semble être un scan');
  });
});

test('XLSX : une section par feuille, feuille vide signalée', async ({ page }) => {
  const r = await convertir(page, async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Nom', 'Âge'], ['Alice', 'trente']]), 'Agents');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([]), 'Vide');
    return [await Fab.classeur('rh.xlsx', wb)];
  });
  const md = r.resultats[0].md;
  expect(md).toContain('## Feuille : Agents');
  expect(md).toContain('| Nom | Âge |\n| --- | --- |\n| Alice | trente |');
  expect(md).toContain('## Feuille : Vide');
  expect(md).toContain('_(feuille vide)_');
});

test('PPTX : texte de chaque diapositive', async ({ page }) => {
  const r = await convertir(page, async () => [await Fab.pptx('pres.pptx', [
    { formes: [Fab.pptxTitre('Bilan'), Fab.pptxCorps(['Point A & B'])] },
    { formes: [Fab.pptxTitre('Suite')] },
  ])]);
  const md = r.resultats[0].md;
  expect(r.journal[0].statut).toBe('ok');
  expect(md).toContain('Bilan');
  expect(md).toContain('Point A & B');
  expect(md.indexOf('Bilan')).toBeLessThan(md.indexOf('Suite'));
});

test.describe('formats refusés', () => {
  test('ancien Word (.doc) : message d\'orientation', async ({ page }) => {
    const r = await convertir(page, () => [Fab.texte('vieux.doc', 'x')]);
    expect(r.journal[0].statut).toBe('err');
    expect(r.journal[0].msg).toContain('enregistrez en .docx');
    expect(r.resultats).toHaveLength(0);
  });

  test('extension inconnue', async ({ page }) => {
    const r = await convertir(page, () => [Fab.texte('image.bmp', 'x')]);
    expect(r.journal[0].msg).toBe('Format non pris en charge : .bmp');
  });

  test('fichier corrompu : erreur dans le journal, les autres fichiers continuent', async ({ page }) => {
    const r = await convertir(page, () => [Fab.texte('casse.pptx', 'pas un zip'), Fab.texte('ok.txt', 'ok')]);
    expect(r.journal.find(j => j.nom === 'casse.pptx').statut).toBe('err');
    expect(r.journal.find(j => j.nom === 'ok.txt').statut).toBe('ok');
  });
});

test('journal dans l\'ordre de dépôt malgré la conversion parallèle', async ({ page }) => {
  const r = await convertir(page, () => ['a', 'b', 'c', 'd', 'e', 'f'].map(n => Fab.texte(n + '.txt', n)));
  expect(r.journal.map(j => j.nom)).toEqual(['a.txt', 'b.txt', 'c.txt', 'd.txt', 'e.txt', 'f.txt']);
});

test('ZIP : un .md par fichier, homonymes renommés', async ({ page }) => {
  await convertir(page, () => [Fab.texte('rapport.txt', 'un'), Fab.texte('rapport.csv', 'a\n1\n')]);
  await expect(page.locator('#btn-zip')).toBeVisible();
  const [telechargement] = await Promise.all([page.waitForEvent('download'), page.click('#btn-zip')]);
  const zip = await JSZip.loadAsync(fs.readFileSync(await telechargement.path()));
  expect(Object.keys(zip.files).sort()).toEqual(['rapport.md', 'rapport_2.md']);
});

test('Vider réinitialise le journal et les résultats', async ({ page }) => {
  await convertir(page, () => [Fab.texte('a.txt', 'a'), Fab.texte('b.txt', 'b')]);
  await page.click('#btn-vider');
  await expect(page.locator('#journal-section')).toBeHidden();
  expect(await page.evaluate(() => resultats.length)).toBe(0);
});
