// Outils communs aux tests.
'use strict';

const path = require('path');
const { test: base, expect } = require('@playwright/test');

// Chaque page reçoit les fabriques de fichiers. Font échouer le test : toute
// erreur JS non attrapée, toute violation de la CSP et tout échec de
// vérification d'intégrité (SRI) — sauf si le test les provoque exprès
// (page.securiteAttendue = true). Les violations sont aussi relevées dans
// window.__violationsCsp pour les tests de confidentialité.
const test = base.extend({
  page: async ({ page }, use) => {
    const erreurs = [], securite = [];
    page.on('pageerror', e => erreurs.push(e.message));
    page.on('console', m => {
      if (/Content Security Policy|integrity/i.test(m.text())) securite.push(m.text());
    });
    await page.addInitScript(() => {
      window.__violationsCsp = [];
      document.addEventListener('securitypolicyviolation', e =>
        window.__violationsCsp.push({ directive: e.effectiveDirective, url: e.blockedURI }));
    });
    await page.addInitScript({ path: path.join(__dirname, 'fabriques.js') });
    await use(page);
    expect(erreurs, 'erreurs JavaScript dans la page').toEqual([]);
    if (!page.securiteAttendue) expect(securite, 'violations CSP ou échecs SRI').toEqual([]);
  },
});

// Ouvre l'application et attend que toutes les bibliothèques soient chargées.
async function ouvrirApp(page) {
  await page.goto('index.html');
  await page.waitForFunction(() =>
    window.mammoth && window.TurndownService && window.pdfjsLib && window.XLSX && window.Papa && window.JSZip);
}

module.exports = { test, expect, ouvrirApp };
