// @ts-check
const { defineConfig } = require('@playwright/test');

const PORT = Number(process.env.PORT_TEST || 8899);

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '*.spec.js',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/app/`,
    browserName: 'chromium',
    // Le service worker n'est activé que dans pwa.spec.js : ailleurs il mettrait
    // en cache des réponses entre tests.
    serviceWorkers: 'block',
    // En CI, trace conservée pour chaque échec (téléchargeable depuis GitHub)
    trace: process.env.CI ? 'retain-on-failure' : 'off',
  },
  webServer: {
    command: 'node tests/serveur.js',
    url: `http://localhost:${PORT}/app/index.html`,
    reuseExistingServer: !process.env.CI,
  },
});
