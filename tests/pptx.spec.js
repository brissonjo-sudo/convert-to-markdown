// PowerPoint : ordre réel, titres, puces, tableaux, images, notes.
'use strict';

const fs = require('fs');
const JSZip = require('jszip');
const { test, expect, ouvrirApp } = require('./aide');

test.beforeEach(async ({ page }) => { await ouvrirApp(page); });

// Présentation type d'un conseil municipal.
async function convertirPresentation(page, options = {}) {
  return page.evaluate(async options => {
    const diapos = [
      { formes: [Fab.pptxTitre('Budget 2026'), Fab.pptxZone(['Conseil municipal du 12 mars'])] },
      { formes: [
          Fab.pptxTitre('Priorités'),
          Fab.pptxCorps(['Écoles', { t: 'Rénovation thermique', lvl: 1 }, { t: 'Cantines', lvl: 1 }, 'Voirie']),
          Fab.pptxImage('rIdImg', 'Carte des travaux'),
        ],
        images: { rIdImg: Fab.PNG_B64 },
        notes: 'Insister sur le calendrier.\nRappeler le vote de juin.' },
      { formes: [Fab.pptxTitre('Répartition'), Fab.pptxTableau([['Poste', 'Montant'], ['Écoles', '1,2 M€'], ['Voirie & réseaux', '0,8 M€']])] },
      { formes: [Fab.pptxTitre('Annexe interne')], masquee: true },
    ];
    await traiterFichiers([await Fab.pptx('budget.pptx', diapos, options)]);
    return __resume();
  }, options);
}

test('titres de diapositive et zones de texte', async ({ page }) => {
  const { resultats } = await convertirPresentation(page);
  const md = resultats[0].md;
  expect(md).toMatch(/^# budget\n\n## Diapositive 1 : Budget 2026\n\nConseil municipal du 12 mars\n/);
  expect(md).toContain('## Diapositive 2 : Priorités');
});

test('puces avec niveaux d\'indentation', async ({ page }) => {
  const md = (await convertirPresentation(page)).resultats[0].md;
  expect(md).toContain('- Écoles\n  - Rénovation thermique\n  - Cantines\n- Voirie');
});

test('tableaux convertis en tableaux Markdown', async ({ page }) => {
  const md = (await convertirPresentation(page)).resultats[0].md;
  expect(md).toContain('| Poste | Montant |\n| --- | --- |\n| Écoles | 1,2 M€ |\n| Voirie & réseaux | 0,8 M€ |');
});

test('images extraites (via le worker) avec leur texte alternatif', async ({ page }) => {
  const { resultats, stats } = await convertirPresentation(page);
  expect(stats.converties).toBe(1);   // conversion faite dans le worker
  expect(resultats[0].md).toContain('![Carte des travaux](images/budget/image1.png)');
  expect(resultats[0].images).toEqual([{ chemin: 'images/budget/image1.png', octets: 70 }]);

  const [dl] = await Promise.all([page.waitForEvent('download'),
    page.locator('.journal-actions-item button', { hasText: 'Télécharger' }).click()]);
  const zip = await JSZip.loadAsync(fs.readFileSync(await dl.path()));
  expect(zip.file('images/budget/image1.png')).not.toBeNull();
});

test('notes de l\'orateur', async ({ page }) => {
  const md = (await convertirPresentation(page)).resultats[0].md;
  expect(md).toContain('> **Notes de l\'orateur :** Insister sur le calendrier.\n>\n> Rappeler le vote de juin.');
});

test('diapositive masquée signalée', async ({ page }) => {
  const md = (await convertirPresentation(page)).resultats[0].md;
  expect(md).toContain('## Diapositive 4 : Annexe interne *(masquée)*');
});

test('ordre réel de la présentation, et non celui des fichiers internes', async ({ page }) => {
  // Diapositives réorganisées dans PowerPoint : slide3.xml est présentée en premier
  const md = (await convertirPresentation(page, { ordre: [2, 0, 1, 3] })).resultats[0].md;
  const titres = [...md.matchAll(/^## (.+)$/gm)].map(m => m[1]);
  expect(titres).toEqual([
    'Diapositive 1 : Répartition', 'Diapositive 2 : Budget 2026',
    'Diapositive 3 : Priorités', 'Diapositive 4 : Annexe interne *(masquée)*',
  ]);
});

test('dates, pieds de page, numéros et contenu de repli ignorés ; entités XML', async ({ page }) => {
  const md = await page.evaluate(async () => {
    const espace = (type, texte) => `<p:sp><p:nvSpPr><p:cNvPr id="9" name="x"/><p:cNvSpPr/><p:nvPr><p:ph type="${type}"/></p:nvPr></p:nvSpPr>` +
      `<p:spPr/><p:txBody><a:bodyPr/><a:p><a:r><a:t>${texte}</a:t></a:r></a:p></p:txBody></p:sp>`;
    const formes = [
      Fab.pptxTitre('Séance'),
      espace('dt', '12/03/2026'), espace('ftr', 'Ville de Saint-Ouen'), espace('sldNum', '7'),
      // Texte littéral « &lt; », dans un paragraphe avec un taquet de tabulation
      // (<a:tab> était confondu avec <a:t> : du balisage brut finissait dans le texte)
      Fab.pptxZone(['seuil &lt; 5']).replace('<a:p><a:r>',
        '<a:p><a:pPr><a:tabLst><a:tab pos="914400" algn="l"/></a:tabLst></a:pPr><a:r>'),
      '<mc:AlternateContent><mc:Choice Requires="x">' + Fab.pptxZone(['Version récente']) + '</mc:Choice>' +
      '<mc:Fallback>' + Fab.pptxZone(['Version récente']) + '</mc:Fallback></mc:AlternateContent>',
    ];
    await traiterFichiers([await Fab.pptx('seance.pptx', [{ formes }])]);
    return resultats[0].md;
  });
  expect(md).not.toMatch(/12\/03\/2026|Ville de Saint-Ouen|\n7\n/);
  expect(md).toContain('\n\nseuil &lt; 5\n');
  expect(md).not.toContain('<a:');
  expect(md.match(/Version récente/g)).toHaveLength(1);
});

test('repli sur le fil principal : même résultat', async ({ page }) => {
  const viaWorker = (await convertirPresentation(page)).resultats[0];
  await page.addInitScript(() => {
    self.__URLS_LIBS_TEST__ = { xlsx: '/introuvable.js', papaparse: '/introuvable.js', jszip: '/introuvable.js' };
  });
  await ouvrirApp(page);
  const r = await convertirPresentation(page);
  expect(r.stats.replis).toBe(1);
  expect(r.resultats[0].md).toBe(viaWorker.md);
  expect(r.resultats[0].images).toEqual(viaWorker.images);
});
