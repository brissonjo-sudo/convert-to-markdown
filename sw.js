/* Service worker — fonctionnement 100 % hors-ligne après la première visite.
 *
 * MISE À JOUR :
 *  - Modifier index.html seul : rien à faire. Les navigations sont servies en
 *    « réseau d'abord » ; la nouvelle version s'affiche au rechargement suivant.
 *  - Changer la version d'une bibliothèque CDN : mettre à jour l'URL dans
 *    index.html ET dans PRECACHE ci-dessous, PUIS incrémenter VERSION. L'ancien
 *    cache est purgé à l'activation ; les nouvelles libs sont prises au rechargement.
 */
'use strict';

const VERSION = 'conv-md-v1';                 // ← nom du cache ; bump si libs CDN changent
const CDN = 'https://cdnjs.cloudflare.com/ajax/libs';

// Coquille de l'application + 7 URLs CDN épinglées (6 libs + worker PDF.js).
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icone.svg',
  `${CDN}/mammoth/1.6.0/mammoth.browser.min.js`,
  `${CDN}/turndown/7.1.2/turndown.min.js`,
  `${CDN}/pdf.js/3.11.174/pdf.min.js`,
  `${CDN}/pdf.js/3.11.174/pdf.worker.min.js`,
  `${CDN}/xlsx/0.18.5/xlsx.full.min.js`,
  `${CDN}/PapaParse/5.4.1/papaparse.min.js`,
  `${CDN}/jszip/3.10.1/jszip.min.js`,
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // mode:'cors' pour les URLs CDN : cdnjs envoie Access-Control-Allow-Origin:*,
    // donc addAll valide les statuts (échoue proprement sur 404) et la réponse
    // n'est pas opaque — les <script crossorigin> et importScripts la réutilisent.
    await cache.addAll(PRECACHE.map(u =>
      new Request(u, { mode: u.startsWith('http') ? 'cors' : 'same-origin' })
    ));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const noms = await caches.keys();
    await Promise.all(noms.filter(n => n !== VERSION).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Navigations : réseau d'abord (index.html à jour), repli cache hors-ligne.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const reseau = await fetch(req);
        const cache = await caches.open(VERSION);
        cache.put('./index.html', reseau.clone());
        return reseau;
      } catch {
        return (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  // Tout le reste (libs épinglées, icône, manifeste) : cache d'abord, repli réseau.
  event.respondWith((async () => {
    const enCache = await caches.match(req);
    if (enCache) return enCache;
    return fetch(req);
  })());
});
