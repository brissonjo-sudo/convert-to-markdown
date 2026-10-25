// Vérifie les empreintes SRI d'index.html contre les fichiers réellement servis
// par les CDN (lancé par la CI, qui a accès à Internet), et que tout script venant
// d'un CDN en a une. Affiche l'empreinte réelle en cas d'écart.
//
//   node tests/verifier-cdn.js               contrôles + téléchargements
//   node tests/verifier-cdn.js --sans-reseau contrôles de cohérence seulement
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RACINE = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(RACINE, 'index.html'), 'utf8');
const sw   = fs.readFileSync(path.join(RACINE, 'sw.js'), 'utf8');
const URL_CDN = /https:\/\/(?:cdnjs\.cloudflare\.com\/ajax\/libs|cdn\.jsdelivr\.net\/npm)\/[^'"`\s]+/g;

let erreurs = 0;
const erreur = msg => { console.error('✘ ' + msg); erreurs++; };

// Empreinte déclarée pour chaque URL : une ligne qui porte à la fois l'URL et
// l'empreinte (balise <script integrity> ou entrée de la table INTEGRITE)
const empreintes = new Map();
for (const ligne of html.split('\n')) {
  const url = (ligne.match(URL_CDN) || [])[0];
  const sri = (ligne.match(/sha384-[A-Za-z0-9+/=]+/) || [])[0];
  if (!url || !sri) continue;
  if (empreintes.has(url) && empreintes.get(url) !== sri) erreur(`empreintes différentes pour ${url}`);
  empreintes.set(url, sri);
}

// Toute balise <script> externe porte une empreinte
for (const balise of html.match(/<script\b[^>]*\bsrc="https:[^>]*>/g) || []) {
  if (!/\bintegrity="sha384-/.test(balise)) erreur(`balise sans empreinte : ${balise}`);
}

// Tout script .js venant d'un CDN (dans la page ou le service worker) a une
// empreinte : sinon il pourrait s'exécuter sans vérification
const CDN_SW = { CDN: 'https://cdnjs.cloudflare.com/ajax/libs', NPM: 'https://cdn.jsdelivr.net/npm' };
const urlsSw = [...sw.matchAll(/`\$\{(CDN|NPM)\}(\/[^`]+)`/g)].map(m => CDN_SW[m[1]] + m[2]);
for (const url of new Set([...(html.match(URL_CDN) || []), ...urlsSw])) {
  if (url.endsWith('.js') && !empreintes.has(url)) erreur(`script de CDN sans empreinte : ${url}`);
}

console.log(`${empreintes.size} fichiers avec empreinte`);

(async () => {
  if (!process.argv.includes('--sans-reseau')) {
    for (const [url, attendue] of empreintes) {
      const rep = await fetch(url);
      if (!rep.ok) { erreur(`${url} : HTTP ${rep.status}`); continue; }
      const reelle = 'sha384-' + crypto.createHash('sha384').update(Buffer.from(await rep.arrayBuffer())).digest('base64');
      if (reelle === attendue) console.log(`✔ ${url}`);
      else erreur(`${url}\n    déclarée : ${attendue}\n    réelle   : ${reelle}`);
    }
  }
  if (erreurs) { console.error(`\n${erreurs} problème(s)`); process.exit(1); }
  console.log('Empreintes conformes');
})();
