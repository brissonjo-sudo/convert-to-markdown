// Serveur statique de TEST (aucune dépendance).
//
//  /app/<fichier>      → fichier du dépôt ; dans index.html et sw.js, les URLs
//                        cdnjs sont réécrites vers /__libs__/ (tests hors réseau,
//                        mêmes versions épinglées, installées via npm).
//  /__libs__/<chemin>  → la bibliothèque correspondante dans node_modules.
//
// Le reste du code testé est servi octet pour octet tel qu'il est publié.
'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT   = Number(process.env.PORT_TEST || 8899);
const RACINE = path.resolve(__dirname, '..');
const CDN    = 'https://cdnjs.cloudflare.com/ajax/libs';

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

  if (chemin.startsWith('/app/')) {
    const relatif = chemin.slice('/app/'.length) || 'index.html';
    const fichier = path.join(RACINE, relatif);
    if (!fichier.startsWith(RACINE + path.sep) || !fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()) {
      return envoyer(res, 404, 'introuvable');
    }
    const ext = path.extname(fichier);
    let corps = fs.readFileSync(fichier);
    if (relatif === 'index.html' || relatif === 'sw.js') {
      corps = corps.toString('utf8').split(CDN).join(`http://localhost:${PORT}/__libs__`);
    }
    return envoyer(res, 200, corps, TYPES[ext]);
  }

  envoyer(res, 404, 'introuvable');
});

serveur.listen(PORT, () => console.log(`Serveur de test : http://localhost:${PORT}/app/`));
