// Fichiers produits par de vrais logiciels (LibreOffice, pandoc) : leur structure
// interne diffère de celle des fabriques (listes découpées, styles imbriqués…).
// Sources et régénération : tests/fichiers/generer.sh
'use strict';

const fs = require('fs');
const path = require('path');
const { test, expect, ouvrirApp } = require('./aide');

async function convertir(page, noms) {
  await ouvrirApp(page);
  const fichiers = noms.map(n => ({ n, b64: fs.readFileSync(path.join(__dirname, 'fichiers', n)).toString('base64') }));
  return page.evaluate(async fichiers => {
    await traiterFichiers(fichiers.map(f => new File([Uint8Array.from(atob(f.b64), c => c.charCodeAt(0))], f.n)));
    return __resume();
  }, fichiers);
}

const PRESENTATION =
  '## Diapositive 1 : Budget 2026\n\nConseil municipal\n\n' +
  '## Diapositive 2 : Priorités\n\n- Écoles\n  - Cantines\n- Voirie\n\n' +
  '> **Notes de l\'orateur :** Insister sur le calendrier.\n\n' +
  '## Diapositive 3 : Répartition\n\n| Poste | Montant |\n| --- | --- |\n| Écoles | 1,2 M€ |\n';

test('présentation LibreOffice (.odp) et PowerPoint (.pptx) : même résultat', async ({ page }) => {
  const r = await convertir(page, ['presentation.odp', 'presentation.pptx']);
  expect(r.journal.map(j => j.statut)).toEqual(['ok', 'ok']);
  for (const res of r.resultats) expect(res.md).toBe('# presentation\n\n' + PRESENTATION);
});

test('document Writer (.odt) et Word (.docx) : même contenu', async ({ page }) => {
  const r = await convertir(page, ['rapport.odt', 'rapport.docx']);
  for (const { nom, md, images } of r.resultats) {
    expect(md, nom).toContain('Texte avec **gras**, *italique* et un [lien](https://saint-ouen.fr). Une note[^1].');
    expect(md, nom).toContain('## Services');
    expect(md, nom).toMatch(/- {1,3}Voirie\n {2,4}- {1,3}Trottoirs\n- {1,3}Écoles/);
    expect(md, nom).toMatch(/1\. {1,2}Premier\n2\. {1,2}Second/);
    expect(md, nom).toContain('![Logo de la ville](images/rapport');
    expect(md, nom).toContain('| Poste | Montant |\n| --- | --- |\n| Écoles | 1,2 M€ |');
    expect(md.trimEnd().endsWith('[^1]: Source : service RH.'), nom).toBe(true);
    expect(md, nom).not.toContain('#footnote');   // plus de liens internes cassés
    expect(images, nom).toHaveLength(1);
  }
});

test('tableau HTML enregistré par LibreOffice : cellule fusionnée alignée', async ({ page }) => {
  const r = await convertir(page, ['tableau.odt']);
  expect(r.resultats[0].md).toBe('| Budget 2026 |  |\n| --- | --- |\n| Poste | Montant |\n| Écoles | 1,2 M€ |\n');
});
