// Livres numériques .epub : chapitres dans l'ordre de lecture, images extraites.
'use strict';

const { test, expect, ouvrirApp } = require('./aide');

test.beforeEach(async ({ page }) => { await ouvrirApp(page); });

// EPUB minimal : le chapitre « b » est lu avant « a » (ordre du spine, pas des noms)
async function convertirEpub(page, { sansOpf = false } = {}) {
  return page.evaluate(async sansOpf => {
    const zip = new JSZip();
    zip.file('mimetype', 'application/epub+zip');
    zip.file('META-INF/container.xml', '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">' +
      '<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
    if (!sansOpf) {
      zip.file('OEBPS/content.opf', '<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0">' +
        '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Guide du stationnement</dc:title></metadata>' +
        '<manifest><item id="a" href="texte/a.xhtml" media-type="application/xhtml+xml"/>' +
        '<item id="b" href="texte/b%20regles.xhtml" media-type="application/xhtml+xml"/>' +
        '<item id="plan" href="img/plan.png" media-type="image/png"/></manifest>' +
        '<spine><itemref idref="b"/><itemref idref="a"/></spine></package>');
    }
    const page = corps => '<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>x</title>' +
      '<style>p{color:red}</style></head><body>' + corps + '</body></html>';
    zip.file('OEBPS/texte/b regles.xhtml', page('<h1>Les règles</h1><p>Stationnement <b>interdit</b> ici.</p>' +
      '<p><img src="../img/plan.png" alt="Plan"/></p><p><img src="../img/absente.png" alt="Absente"/></p>'));
    zip.file('OEBPS/texte/a.xhtml', page('<h1>Annexe</h1><h2>Contacts</h2><p>Voir <a href="b%20regles.xhtml#r">les règles</a> ' +
      'et le <a href="https://saint-ouen.fr">site</a>, pas <a href="javascript:alert(1)">ceci</a>.</p>'));
    zip.file('OEBPS/img/plan.png', Fab.PNG_B64, { base64: true });
    await traiterFichiers([new File([await zip.generateAsync({ type: 'blob' })], 'guide.epub')]);
    return __resume();
  }, sansOpf);
}

test('chapitres dans l\'ordre de lecture, titres sous celui du livre, image extraite', async ({ page }) => {
  const r = await convertirEpub(page);
  expect(r.journal[0].msg).toBe('Converti → guide.md (+ 1 image)');
  expect(r.resultats[0].md).toBe(
    '# Guide du stationnement\n\n' +
    '## Les règles\n\nStationnement **interdit** ici.\n\n![Plan](images/guide/image1.png)\n\n' +
    '## Annexe\n\n### Contacts\n\nVoir les règles et le [site](https://saint-ouen.fr), pas ceci.\n');
  expect(r.resultats[0].images).toEqual([{ chemin: 'images/guide/image1.png', octets: 70 }]);
});

test('EPUB sans description du livre (content.opf) : erreur claire', async ({ page }) => {
  const r = await convertirEpub(page, { sansOpf: true });
  expect(r.journal[0].statut).toBe('err');
  expect(r.journal[0].msg).toBe('Erreur : Fichier EPUB invalide (description du livre introuvable).');
});
