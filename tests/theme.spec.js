// Thème sombre : suit le réglage du système ; le thème clair reste inchangé.
'use strict';

const { test, expect, ouvrirApp } = require('./aide');

// Contraste WCAG entre deux couleurs « rgb(r, g, b) »
function contraste(a, b) {
  const lum = c => {
    const [r, g, v] = c.match(/\d+/g).slice(0, 3).map(n => {
      const x = n / 255;
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * v;
  };
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

async function couleurs(page) {
  await page.evaluate(() => traiterFichiers([Fab.texte('a.txt', 'x')]));
  await expect(page.locator('.journal-item')).toHaveClass(/ok/);
  return page.evaluate(() => {
    const st = s => getComputedStyle(document.querySelector(s));
    return {
      fond: st('body').backgroundColor, texte: st('body').color,
      surface: st('.journal-section').backgroundColor,
      nom: st('.journal-nom').color, msg: st('.journal-msg').color,
      badgeFond: st('.confidentialite').backgroundColor, badgeTexte: st('.confidentialite').color,
    };
  });
}

test('système en mode sombre : fond sombre, textes lisibles', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await ouvrirApp(page);
  const c = await couleurs(page);
  expect(c.fond).toBe('rgb(15, 23, 42)');
  for (const [texte, fond] of [[c.texte, c.fond], [c.nom, c.surface], [c.msg, c.surface], [c.badgeTexte, c.badgeFond]]) {
    expect(contraste(texte, fond), `${texte} sur ${fond}`).toBeGreaterThanOrEqual(4.5);
  }
});

test('système en mode clair : couleurs d\'origine', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await ouvrirApp(page);
  const c = await couleurs(page);
  expect(c.fond).toBe('rgb(248, 250, 252)');
  expect(c.nom).toBe('rgb(37, 99, 235)');
  expect(c.badgeFond).toBe('rgb(240, 253, 244)');
});
