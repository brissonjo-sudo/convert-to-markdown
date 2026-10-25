// LibreOffice : documents (.odt) et présentations (.odp).
'use strict';

const { test, expect, ouvrirApp } = require('./aide');

const STYLES_ODT =
  '<style:style style:name="T1" style:family="text"><style:text-properties fo:font-weight="bold"/></style:style>' +
  '<style:style style:name="T2" style:family="text"><style:text-properties fo:font-style="italic"/></style:style>' +
  '<text:list-style style:name="LNum"><text:list-level-style-number text:level="1" style:num-format="1"/></text:list-style>' +
  '<text:list-style style:name="LPuce"><text:list-level-style-bullet text:level="1" text:bullet-char="•"/>' +
  '<text:list-level-style-bullet text:level="2" text:bullet-char="◦"/></text:list-style>';

const cellule = t => `<table:table-cell><text:p>${t}</text:p></table:table-cell>`;

const CORPS_ODT =
  '<text:h text:outline-level="1">Rapport d\'activité</text:h>' +
  '<text:p>Texte avec <text:span text:style-name="T1">gras</text:span>, <text:span text:style-name="T2">italique </text:span>' +
  'et un <text:a xlink:href="https://saint-ouen.fr">lien</text:a>.</text:p>' +
  '<text:h text:outline-level="2">Contexte</text:h>' +
  '<text:p>Deux<text:s text:c="2"/>espaces, fichier nom_final et note<text:note text:note-class="footnote">' +
  '<text:note-citation>1</text:note-citation><text:note-body><text:p>Source : service RH.</text:p></text:note-body></text:note>.</text:p>' +
  '<text:list text:style-name="LPuce"><text:list-item><text:p>Voirie</text:p><text:list><text:list-item><text:p>Trottoirs</text:p>' +
  '</text:list-item></text:list></text:list-item><text:list-item><text:p>Écoles</text:p></text:list-item></text:list>' +
  '<text:list text:style-name="LNum"><text:list-item><text:p>Premier</text:p></text:list-item>' +
  '<text:list-item><text:p>Second</text:p></text:list-item></text:list>' +
  '<table:table><table:table-column/><table:table-column/>' +
  '<table:table-row><table:table-cell table:number-columns-spanned="2"><text:p>Budget 2026</text:p></table:table-cell><table:covered-table-cell/></table:table-row>' +
  `<table:table-row>${cellule('Poste')}${cellule('Montant')}<table:table-cell table:number-columns-repeated="1020"/></table:table-row>` +
  `<table:table-row>${cellule('Écoles')}${cellule('1,2 M€')}</table:table-row>` +
  '<table:table-row table:number-rows-repeated="500"><table:table-cell table:number-columns-repeated="3"/></table:table-row></table:table>' +
  '<text:p><draw:frame draw:name="Logo"><draw:image xlink:href="Pictures/logo.png"/><svg:title>Logo de la ville</svg:title></draw:frame></text:p>' +
  '<text:table-of-content><text:index-body><text:p>Rapport d\'activité ........ 1</text:p></text:index-body></text:table-of-content>' +
  '<text:tracked-changes><text:changed-region><text:deletion><text:p>texte supprimé</text:p></text:deletion></text:changed-region></text:tracked-changes>';

const titreOdp = t => `<draw:frame presentation:class="title"><draw:text-box><text:p>${t}</text:p></draw:text-box></draw:frame>`;
const CORPS_ODP =
  '<draw:page draw:name="p1">' + titreOdp('Budget 2026') +
  '<draw:frame presentation:class="subtitle"><draw:text-box><text:p>Conseil municipal</text:p></draw:text-box></draw:frame>' +
  '<draw:frame presentation:class="page-number"><draw:text-box><text:p>N°7</text:p></draw:text-box></draw:frame></draw:page>' +
  '<draw:page draw:name="p2">' + titreOdp('Priorités') +
  '<draw:frame presentation:class="outline"><draw:text-box><text:list><text:list-item><text:p>Écoles</text:p><text:list><text:list-item>' +
  '<text:p>Cantines</text:p></text:list-item></text:list></text:list-item><text:list-item><text:p>Voirie</text:p></text:list-item></text:list></draw:text-box></draw:frame>' +
  '<draw:frame><draw:image xlink:href="Pictures/carte.png"/><svg:title>Carte</svg:title></draw:frame>' +
  '<presentation:notes><draw:page-thumbnail/><draw:frame presentation:class="notes"><draw:text-box>' +
  '<text:p>Insister sur le calendrier.</text:p></draw:text-box></draw:frame></presentation:notes></draw:page>' +
  '<draw:page draw:name="p3" draw:style-name="dpMasquee">' + titreOdp('Répartition') +
  `<draw:frame><table:table><table:table-row>${cellule('Poste')}${cellule('Montant')}</table:table-row>` +
  `<table:table-row>${cellule('Écoles')}${cellule('1,2 M€')}</table:table-row></table:table></draw:frame>` +
  '<draw:g><draw:custom-shape><text:p>Forme groupée</text:p></draw:custom-shape></draw:g></draw:page>';
const STYLES_ODP = '<style:style style:name="dpMasquee" style:family="drawing-page"><style:drawing-page-properties presentation:visibility="hidden"/></style:style>';

async function convertir(page, type, urlsLibs) {
  if (urlsLibs) await page.addInitScript(u => { self.__URLS_LIBS_TEST__ = u; }, urlsLibs);
  await ouvrirApp(page);
  return page.evaluate(async ({ type, args }) => {
    const [nom, corps, styles] = args;
    const images = { 'Pictures/logo.png': Fab.PNG_B64, 'Pictures/carte.png': Fab.PNG_B64 };
    await traiterFichiers([await Fab[type](nom, corps, { styles, images })]);
    return __resume();
  }, { type, args: type === 'odt' ? ['rapport.odt', CORPS_ODT, STYLES_ODT] : ['budget.odp', CORPS_ODP, STYLES_ODP] });
}

test.describe('Writer (.odt)', () => {
  test('titres, mise en forme, liens, espaces et caractères échappés', async ({ page }) => {
    const { resultats, journal } = await convertir(page, 'odt');
    expect(journal[0].statut).toBe('ok');
    const md = resultats[0].md;
    expect(md).toMatch(/^# Rapport d'activité\n\nTexte avec \*\*gras\*\*, \*italique\* et un \[lien\]\(https:\/\/saint-ouen\.fr\)\.\n\n## Contexte\n/);
    expect(md).toContain('Deux  espaces, fichier nom\\_final et note[^1].');
  });

  test('listes à puces imbriquées et listes numérotées', async ({ page }) => {
    const md = (await convertir(page, 'odt')).resultats[0].md;
    expect(md).toContain('- Voirie\n  - Trottoirs\n- Écoles\n\n1. Premier\n2. Second');
  });

  test('tableau : cellule fusionnée alignée, cellules répétées vides rognées', async ({ page }) => {
    const md = (await convertir(page, 'odt')).resultats[0].md;
    expect(md).toContain('| Budget 2026 |  |\n| --- | --- |\n| Poste | Montant |\n| Écoles | 1,2 M€ |\n\n');
  });

  test('image extraite, note de bas de page, sommaire et texte supprimé ignorés', async ({ page }) => {
    const { resultats } = await convertir(page, 'odt');
    const md = resultats[0].md;
    expect(md).toContain('![Logo de la ville](images/rapport/image1.png)');
    expect(resultats[0].images).toEqual([{ chemin: 'images/rapport/image1.png', octets: 70 }]);
    expect(md.trimEnd().endsWith('[^1]: Source : service RH.')).toBe(true);
    expect(md).not.toMatch(/\.\.\.\.|texte supprimé/);
  });
});

test.describe('Impress (.odp)', () => {
  test('diapositives : titres, puces, image, notes, tableau, masquage, groupes', async ({ page }) => {
    const { resultats, stats } = await convertir(page, 'odp');
    expect(stats.converties).toBe(1);   // converti dans le worker
    expect(resultats[0].md).toBe(
      '# budget\n\n' +
      '## Diapositive 1 : Budget 2026\n\nConseil municipal\n\n' +
      '## Diapositive 2 : Priorités\n\n- Écoles\n  - Cantines\n- Voirie\n\n![Carte](images/budget/image1.png)\n\n' +
      '> **Notes de l\'orateur :** Insister sur le calendrier.\n\n' +
      '## Diapositive 3 : Répartition *(masquée)*\n\n| Poste | Montant |\n| --- | --- |\n| Écoles | 1,2 M€ |\n\nForme groupée\n');
  });
});

test('repli sur le fil principal : même résultat', async ({ page }) => {
  const viaWorker = (await convertir(page, 'odt')).resultats[0];
  const r = await convertir(page, 'odt', { xlsx: '/x.js', papaparse: '/x.js', jszip: '/x.js' });
  expect(r.stats.replis).toBe(1);
  expect(r.resultats[0].md).toBe(viaWorker.md);
});

test('fichier OpenDocument corrompu : erreur claire', async ({ page }) => {
  await ouvrirApp(page);
  const r = await page.evaluate(async () => {
    const zip = new JSZip();
    zip.file('mimetype', 'application/vnd.oasis.opendocument.text');
    await traiterFichiers([new File([await zip.generateAsync({ type: 'arraybuffer' })], 'vide.odt')]);
    return __resume();
  });
  expect(r.journal[0].statut).toBe('err');
  expect(r.journal[0].msg).toBe('Erreur : Fichier OpenDocument invalide (content.xml absent).');
});
