// Courriels .eml (Outlook « Enregistrer sous », Thunderbird) : en-têtes, corps,
// image intégrée, pièces jointes.
'use strict';

const { test, expect, ouvrirApp } = require('./aide');

test.beforeEach(async ({ page }) => { await ouvrirApp(page); });

const b64 = s => Buffer.from(s, 'utf8').toString('base64');

async function convertir(page, nom, eml, encodage) {
  return page.evaluate(async ({ nom, eml, encodage }) => {
    await traiterFichiers([Fab.texte(nom, eml, encodage)]);
    return __resume();
  }, { nom, eml, encodage });
}

test('texte et HTML en alternative : en-têtes décodés, version HTML retenue', async ({ page }) => {
  const eml = [
    'From: =?UTF-8?B?' + b64('Mairie de Saint-Ouen') + '?= <contact@mairie.fr>',
    'To: agent@mairie.fr',
    'Cc: dpm@mairie.fr',
    'Subject: =?UTF-8?Q?Arr=C3=AAt=C3=A9_n=C2=B042?= =?UTF-8?Q?_=E2=80=94_stationnement?=',
    'Date: Sat, 25 Oct 2026 14:03:00 +0200',
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="b1"',
    '',
    'Préambule ignoré.',
    '--b1',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: quoted-printable',
    '',
    'Version texte =C3=A0 ignorer.',
    '--b1',
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    b64('<p>Bonjour,</p><p>Le stationnement est <b>interdit</b> <a href="javascript:alert(1)">ici</a>.</p>'),
    '--b1--',
    '',
  ].join('\r\n');
  const r = await convertir(page, 'courrier.eml', eml);
  expect(r.journal[0].statut).toBe('ok');
  expect(r.resultats[0].md).toBe(
    '# Arrêté n°42 — stationnement\n\n' +
    '- **De :** Mairie de Saint-Ouen <contact@mairie.fr>\n' +
    '- **À :** agent@mairie.fr\n' +
    '- **Cc :** dpm@mairie.fr\n' +
    '- **Date :** Sat, 25 Oct 2026 14:03:00 +0200\n\n' +
    '---\n\n' +
    'Bonjour,\n\nLe stationnement est **interdit** ici.\n');
});

test('image intégrée et pièces jointes : fichiers extraits, noms rendus sûrs', async ({ page }) => {
  const eml = [
    'From: rh@mairie.fr',
    'Subject: Dossier',
    'Content-Type: multipart/mixed; boundary="ext"',
    '',
    '--ext',
    'Content-Type: multipart/related; boundary="int"',
    '',
    '--int',
    'Content-Type: text/html; charset=utf-8',
    '',
    '<p>Voir le logo : <img src="cid:logo@mairie" alt="Logo"></p>',
    '--int',
    'Content-Type: image/png',
    'Content-Transfer-Encoding: base64',
    'Content-ID: <logo@mairie>',
    'Content-Disposition: inline; filename="logo.png"',
    '',
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    '--int--',
    '',
    '--ext',
    'Content-Type: application/pdf',
    'Content-Transfer-Encoding: base64',
    "Content-Disposition: attachment; filename*=UTF-8''..%2F..%2Fpi%C3%A8ce%20jointe.pdf",
    '',
    b64('%PDF-1.4 contenu'),
    '--ext',
    'Content-Type: text/plain; name="notes.txt"',
    'Content-Disposition: attachment',
    '',
    'Notes internes',
    '--ext--',
  ].join('\r\n');
  const r = await convertir(page, 'dossier rh.eml', eml);
  const { md, images } = r.resultats[0];
  expect(md).toContain('Voir le logo : ![Logo](pieces-jointes/dossier-rh/logo.png)');
  expect(md).toContain('## Pièces jointes\n\n' +
    '- [..\\_..\\_pièce jointe.pdf](pieces-jointes/dossier-rh/.._.._pi%C3%A8ce%20jointe.pdf)\n' +
    '- [notes.txt](pieces-jointes/dossier-rh/notes.txt)');
  expect(images.map(i => i.chemin)).toEqual(['pieces-jointes/dossier-rh/logo.png',
    'pieces-jointes/dossier-rh/.._.._pièce jointe.pdf', 'pieces-jointes/dossier-rh/notes.txt']);
  expect(images.map(i => i.octets)).toEqual([70, 16, 14]);
  for (const { chemin } of images) expect(chemin.split('/')).not.toContain('..');
  expect(r.journal[0].msg).toBe('Converti → dossier rh.md (+ 3 fichiers)');
});

test('texte brut en Latin-1 (8 bits) et objet absent', async ({ page }) => {
  const eml = ['From: agent@mairie.fr', 'Content-Type: text/plain; charset=iso-8859-1', 'Content-Transfer-Encoding: 8bit', '',
    'Réunion à 14 h, salle des fêtes.'].join('\r\n');
  const r = await convertir(page, 'note.eml', eml, 'windows-1252');
  expect(r.resultats[0].md).toBe('# note\n\n- **De :** agent@mairie.fr\n\n---\n\nRéunion à 14 h, salle des fêtes.\n');
});

test('grosse pièce jointe (5 Mo) : extraite intacte, rapidement', async ({ page }) => {
  const octets = Buffer.alloc(5 * 1024 * 1024, 7);
  const eml = ['Subject: Scan', 'Content-Type: multipart/mixed; boundary="z"', '', '--z', 'Content-Type: text/plain', '', 'Ci-joint.',
    '--z', 'Content-Type: application/pdf; name="scan.pdf"', 'Content-Transfer-Encoding: base64', '',
    octets.toString('base64').replace(/.{76}/g, '$&\r\n'), '--z--'].join('\r\n');
  const debut = Date.now();
  const r = await convertir(page, 'scan.eml', eml);
  expect(Date.now() - debut).toBeLessThan(10_000);
  expect(r.resultats[0].images).toEqual([{ chemin: 'pieces-jointes/scan/scan.pdf', octets: octets.length }]);
  expect(await page.evaluate(() => new Uint8Array(resultats[0].images[0].data).every(o => o === 7))).toBe(true);
});

test('fichier qui n\'est pas un courriel : message clair', async ({ page }) => {
  const r = await convertir(page, 'vide.eml', '');
  expect(r.journal[0].statut).toBe('err');
  expect(r.journal[0].msg).toBe('Erreur : Courriel vide ou illisible.');
});
