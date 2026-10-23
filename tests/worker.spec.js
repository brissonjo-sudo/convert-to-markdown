// Web Worker : conversions lourdes hors du fil principal, et repli.
'use strict';

const { test, expect, ouvrirApp } = require('./aide');

// Lot : petit CSV, gros CSV (100 000 lignes), XLSX, PPTX. Mesure aussi le gel
// maximal de l'interface (dérive d'un minuteur censé tourner toutes les 16 ms).
async function convertirLot(page) {
  return page.evaluate(async () => {
    const lignes = ['col1,col2,col3'];
    for (let i = 0; i < 100000; i++) lignes.push(`v${i},donnée ${i},${i * 2}`);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Nom'], ['Alice']]), 'F1');
    const fichiers = [
      Fab.texte('petit.csv', 'a,b\n1,2\n'),
      Fab.texte('gros.csv', lignes.join('\n')),
      await Fab.classeur('classeur.xlsx', wb),
      await Fab.pptx('pres.pptx', [{ formes: [Fab.pptxTitre('Diapo')] }]),
    ];

    let gelMax = 0, precedent = performance.now();
    const minuteur = setInterval(() => {
      const maintenant = performance.now();
      gelMax = Math.max(gelMax, maintenant - precedent - 16);
      precedent = maintenant;
    }, 16);
    await traiterFichiers(fichiers);
    clearInterval(minuteur);

    const r = __resume();
    r.gelMax = gelMax;
    r.lignesGros = r.resultats.find(x => x.nom === 'gros.csv').md.split('\n').length;
    return r;
  });
}

test('conversions lourdes dans le worker, interface réactive', async ({ page }) => {
  await ouvrirApp(page);
  const r = await convertirLot(page);
  expect(r.journal.map(j => j.statut)).toEqual(['ok', 'ok', 'ok', 'ok']);
  expect(r.stats).toEqual({ converties: 4, replis: 0 });
  expect(r.lignesGros).toBeGreaterThan(100000);
  expect(r.gelMax).toBeLessThan(300);
});

test('repli sur le fil principal si le worker ne peut pas charger ses bibliothèques', async ({ page }) => {
  await page.addInitScript(() => {
    self.__URLS_LIBS_TEST__ = { xlsx: '/introuvable.js', papaparse: '/introuvable.js', jszip: '/introuvable.js' };
  });
  await ouvrirApp(page);
  const r = await convertirLot(page);
  expect(r.journal.map(j => j.statut)).toEqual(['ok', 'ok', 'ok', 'ok']);
  expect(r.stats.converties).toBe(0);
  expect(r.stats.replis).toBe(4);
});

test('une erreur de conversion dans le worker remonte au journal sans repli', async ({ page }) => {
  await ouvrirApp(page);
  const r = await page.evaluate(async () => {
    await traiterFichiers([Fab.texte('casse.pptx', 'pas un zip')]);
    return __resume();
  });
  expect(r.journal[0].statut).toBe('err');
  expect(r.journal[0].msg).toMatch(/^Erreur : /);
  expect(r.stats).toEqual({ converties: 0, replis: 0 });
});
