// Outils communs aux tests.
'use strict';

const path = require('path');
const { test: base, expect } = require('@playwright/test');

// Chaque page reçoit les fabriques de fichiers ; toute erreur JS non attrapée
// dans la page fait échouer le test.
const test = base.extend({
  page: async ({ page }, use) => {
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    await page.addInitScript({ path: path.join(__dirname, 'fabriques.js') });
    await use(page);
    expect(erreurs, 'erreurs JavaScript dans la page').toEqual([]);
  },
});

// Ouvre l'application et attend que toutes les bibliothèques soient chargées.
async function ouvrirApp(page) {
  await page.goto('index.html');
  await page.waitForFunction(() =>
    window.mammoth && window.TurndownService && window.pdfjsLib && window.XLSX && window.Papa && window.JSZip);
}

module.exports = { test, expect, ouvrirApp };
