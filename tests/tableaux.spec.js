// Tableaux Word et HTML : cellules fusionnées, en-têtes, mise en forme.
'use strict';

const { test, expect, ouvrirApp } = require('./aide');

test.beforeEach(async ({ page }) => { await ouvrirApp(page); });

const convertirHtml = (page, html) => page.evaluate(async html => {
  await traiterFichiers([Fab.texte('t.html', `<body>${html}</body>`)]);
  return resultats[0].md;
}, html);

test('Word : titre fusionné sur toute la largeur, aucune colonne perdue', async ({ page }) => {
  const md = await page.evaluate(async () => {
    const cellule = (t, attrs = '') => `<w:tc>${attrs ? `<w:tcPr>${attrs}</w:tcPr>` : ''}<w:p><w:r><w:t>${t}</w:t></w:r></w:p></w:tc>`;
    const tableau = '<w:tbl><w:tblGrid><w:gridCol/><w:gridCol/></w:tblGrid>' +
      `<w:tr>${cellule('Budget 2026', '<w:gridSpan w:val="2"/>')}</w:tr>` +
      `<w:tr>${cellule('Poste')}${cellule('Montant')}</w:tr>` +
      `<w:tr>${cellule('Écoles')}${cellule('1,2 M€')}</w:tr></w:tbl>`;
    await traiterFichiers([await Fab.docx('budget.docx', tableau)]);
    return resultats[0].md;
  });
  expect(md).toContain('| Budget 2026 |  |\n| --- | --- |\n| Poste | Montant |\n| Écoles | 1,2 M€ |');
});

test('Word : fusion verticale', async ({ page }) => {
  const md = await page.evaluate(async () => {
    const cellule = (t, attrs = '') => `<w:tc>${attrs ? `<w:tcPr>${attrs}</w:tcPr>` : ''}<w:p><w:r><w:t>${t}</w:t></w:r></w:p></w:tc>`;
    const vide = attrs => `<w:tc><w:tcPr>${attrs}</w:tcPr><w:p/></w:tc>`;
    const tableau = '<w:tbl><w:tblGrid><w:gridCol/><w:gridCol/></w:tblGrid>' +
      `<w:tr>${cellule('Service')}${cellule('Agent')}</w:tr>` +
      `<w:tr>${cellule('Voirie', '<w:vMerge w:val="restart"/>')}${cellule('Alice')}</w:tr>` +
      `<w:tr>${vide('<w:vMerge/>')}${cellule('Bruno')}</w:tr></w:tbl>`;
    await traiterFichiers([await Fab.docx('agents.docx', tableau)]);
    return resultats[0].md;
  });
  expect(md).toContain('| Service | Agent |\n| --- | --- |\n| Voirie | Alice |\n|  | Bruno |');
});

test('HTML : colspan et rowspan combinés', async ({ page }) => {
  const md = await convertirHtml(page,
    '<table><tr><th>Service</th><th>Agent</th><th>Heures</th></tr>' +
    '<tr><td rowspan="2">Voirie</td><td>A</td><td>10</td></tr><tr><td>B</td><td>12</td></tr>' +
    '<tr><td colspan="2">Total</td><td>22</td></tr></table>');
  expect(md).toContain(
    '| Service | Agent | Heures |\n| --- | --- | --- |\n| Voirie | A | 10 |\n|  | B | 12 |\n| Total |  | 22 |');
});

test('HTML : en-tête sur deux lignes, un seul séparateur', async ({ page }) => {
  const md = await convertirHtml(page,
    '<table><thead><tr><th colspan="2">Effectifs</th></tr><tr><th>2025</th><th>2026</th></tr></thead>' +
    '<tbody><tr><td>412</td><td>420</td></tr></tbody></table>');
  expect(md).toContain('| Effectifs |  |\n| --- | --- |\n| 2025 | 2026 |\n| 412 | 420 |');
  expect(md.match(/\| --- \|/g)).toHaveLength(1);
});

test('HTML : légende, mise en forme et barres verticales dans les cellules', async ({ page }) => {
  const md = await convertirHtml(page,
    '<table><caption>Tarifs 2026</caption><tr><th>Prestation</th><th>Note</th></tr>' +
    '<tr><td><strong>Cantine</strong> et <a href="https://exemple.fr">garderie</a></td><td>tarif A|B</td></tr></table>');
  expect(md).toContain('**Tarifs 2026**\n\n| Prestation | Note |\n| --- | --- |\n| **Cantine** et [garderie](https://exemple.fr) | tarif A\\|B |');
});

test('un rowspan qui déborde ne crée pas de ligne fantôme', async ({ page }) => {
  const md = await convertirHtml(page, '<table><tr><th>A</th><th>B</th></tr><tr><td rowspan="5">x</td><td>y</td></tr></table>');
  expect(md.trim().split('\n').filter(l => l.startsWith('|'))).toHaveLength(3);
});
