// Serveur statique de TEST (aucune dépendance).
//
//  /app/<fichier>      → fichier du dépôt ; dans index.html et sw.js, les URLs
//                        cdnjs et jsDelivr sont réécrites vers /__libs__/ et
//                        /__npm__/ (tests hors réseau, mêmes versions épinglées,
//                        installées via npm).
//  /__libs__/<chemin>  → la bibliothèque cdnjs correspondante dans node_modules.
//  /__npm__/<paquet>@<version>/<chemin> → node_modules/<paquet>/<chemin>, comme
//                        jsDelivr, si la version installée est bien celle demandée.
//
// Le reste du code testé est servi octet pour octet tel qu'il est publié.
'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT   = Number(process.env.PORT_TEST || 8899);
const RACINE = path.resolve(__dirname, '..');
const CDN    = 'https://cdnjs.cloudflare.com/ajax/libs';
const NPM    = 'https://cdn.jsdelivr.net/npm';

// Chemin cdnjs → fichier local (versions identiques à celles d'index.html).
const LIBS = {
  'mammoth/1.6.0/mammoth.browser.min.js': 'mammoth/mammoth.browser.min.js',
  'turndown/7.1.2/turndown.min.js':       'turndown/lib/turndown.browser.umd.js',
  'pdf.js/3.11.174/pdf.min.js':           'pdfjs-dist/build/pdf.min.js',
  'pdf.js/3.11.174/pdf.worker.min.js':    'pdfjs-dist/build/pdf.worker.min.js',
  'xlsx/0.18.5/xlsx.full.min.js':         'xlsx/dist/xlsx.full.min.js',
  'PapaParse/5.4.1/papaparse.min.js':     'papaparse/papaparse.min.js',
  'jszip/3.10.1/jszip.min.js':            'jszip/dist/jszip.min.js',
};

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.gz': 'application/gzip',   // servi tel quel : Tesseract décompresse lui-même
};

function envoyer(res, statut, corps, type) {
  res.writeHead(statut, {
    'Content-Type': type || 'text/plain; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  });
  res.end(corps);
}

const serveur = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const chemin = decodeURIComponent(url.pathname);

  if (chemin.startsWith('/__libs__/')) {
    const cible = LIBS[chemin.slice('/__libs__/'.length)];
    if (!cible) return envoyer(res, 404, 'lib inconnue');
    return envoyer(res, 200, fs.readFileSync(path.join(RACINE, 'node_modules', cible)), TYPES['.js']);
  }

  if (chemin.startsWith('/__npm__/')) {
    const m = chemin.slice('/__npm__/'.length).match(/^((?:@[^/]+\/)?[^@/]+)@([^/]+)\/(.+)$/);
    if (!m) return envoyer(res, 404, 'chemin npm invalide');
    const [, paquet, version, interne] = m;
    const dossier = path.join(RACINE, 'node_modules', paquet);
    const installee = JSON.parse(fs.readFileSync(path.join(dossier, 'package.json'), 'utf8')).version;
    if (installee !== version) return envoyer(res, 404, `${paquet} : ${version} demandée, ${installee} installée`);
    const fichier = path.join(dossier, interne);
    if (!fichier.startsWith(dossier + path.sep) || !fs.existsSync(fichier)) return envoyer(res, 404, 'introuvable');
    return envoyer(res, 200, fs.readFileSync(fichier), TYPES[path.extname(fichier)]);
  }

  if (chemin.startsWith('/app/')) {
    const relatif = chemin.slice('/app/'.length) || 'index.html';
    const fichier = path.join(RACINE, relatif);
    if (!fichier.startsWith(RACINE + path.sep) || !fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()) {
      return envoyer(res, 404, 'introuvable');
    }
    const ext = path.extname(fichier);
    let corps = fs.readFileSync(fichier);
    if (relatif === 'index.html' || relatif === 'sw.js') {
      corps = corps.toString('utf8')
        .split(CDN).join(`http://localhost:${PORT}/__libs__`)
        .split(NPM).join(`http://localhost:${PORT}/__npm__`);
    }
    return envoyer(res, 200, corps, TYPES[ext]);
  }

  envoyer(res, 404, 'introuvable');
});

serveur.listen(PORT, () => console.log(`Serveur de test : http://localhost:${PORT}/app/`));
