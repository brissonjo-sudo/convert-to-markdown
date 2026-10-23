// Tableurs : valeurs telles qu'affichées (dates, montants, pourcentages).
'use strict';

const { test, expect, ouvrirApp } = require('./aide');

// Classeur type d'une collectivité : dates au format court d'Excel, montant en
// euros, taux, nombre décimal, texte ressemblant à un nombre. La plage déclarée
// (A1:H12) déborde, comme après une simple mise en forme.
async function convertirClasseur(page) {
  return page.evaluate(async () => {
    const ws = {
      A1: { t: 's', v: 'Date' }, B1: { t: 's', v: 'Horodatage' }, C1: { t: 's', v: 'Échéance' },
      D1: { t: 's', v: 'Montant' }, E1: { t: 's', v: 'Taux' }, F1: { t: 's', v: 'Ratio' }, G1: { t: 's', v: 'Version' },
      A2: { t: 'n', v: 46096, z: 'm/d/yy' },                  // 15/03/2026, « date courte » d'Excel
      B2: { t: 'n', v: 46096.5, z: 'm/d/yy h:mm' },           // 15/03/2026 12:00
      C2: { t: 'n', v: 46096, z: 'dd/mm/yyyy' },              // format personnalisé explicite
      D2: { t: 'n', v: 1234.5, z: '#,##0.00 "€"' },
      E2: { t: 'n', v: 0.205, z: '0.0%' },
      F2: { t: 'n', v: 3.14 },
      G2: { t: 's', v: 'v1.2' },
      '!ref': 'A1:H12',
    };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Budget');
    await traiterFichiers([await Fab.classeur('budget.xlsx', wb)]);
    return __resume().resultats[0].md;
  });
}

test.describe('navigateur en français', () => {
  test.use({ locale: 'fr-FR' });

  test('dates, montants et taux affichés comme dans Excel', async ({ page }) => {
    await ouvrirApp(page);
    const md = await convertirClasseur(page);
    expect(md).toContain('| 15/03/2026 | 15/03/2026 12:00 | 15/03/2026 | 1 234,50 € | 20,5% | 3,14 | v1.2 |');
  });

  test('lignes et colonnes vides en fin de plage ignorées', async ({ page }) => {
    await ouvrirApp(page);
    const md = await convertirClasseur(page);
    const tableau = md.split('\n').filter(l => l.startsWith('|'));
    expect(tableau).toHaveLength(3);                       // en-tête + séparateur + 1 ligne
    expect(tableau[0].split('|').length - 2).toBe(7);      // 7 colonnes, pas 8
  });
});

test.describe('navigateur en anglais', () => {
  test.use({ locale: 'en-US' });

  test('conventions anglo-saxonnes conservées', async ({ page }) => {
    await ouvrirApp(page);
    const md = await convertirClasseur(page);
    expect(md).toContain('| 3/15/26 |');
    expect(md).toContain('| 1,234.50 € | 20.5% | 3.14 |');
  });
});

test.describe('ODS et XLS', () => {
  test.use({ locale: 'fr-FR' });

  test('passent par le même traitement', async ({ page }) => {
    await ouvrirApp(page);
    const mds = await page.evaluate(async () => {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Ratio'], [3.14]]), 'F');
      await traiterFichiers([await Fab.classeur('a.ods', wb, 'ods'), await Fab.classeur('b.xls', wb, 'biff8')]);
      return __resume().resultats.map(r => r.md);
    });
    expect(mds).toHaveLength(2);
    for (const md of mds) expect(md).toContain('| 3,14 |');
  });
});
