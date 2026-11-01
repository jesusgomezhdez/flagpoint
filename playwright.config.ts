import { defineConfig } from '@playwright/test';

/**
 * Pruebas e2e de la extensión. Usar `pnpm test:e2e`, que compila antes la
 * extensión en `.output/chrome-mv3`. Con `--headed` se ve el navegador.
 */
export default defineConfig({
  testDir: './e2e',
  // Cada prueba lanza su propio Chromium con la extensión; en serie para que
  // el foco de pestañas y la captura no compitan por recursos.
  workers: 1,
  timeout: 45_000,
  reporter: [['list']],
  use: {
    headless: true,
    trace: 'retain-on-failure',
  },
});
