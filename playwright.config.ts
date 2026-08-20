import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para Triex App
 * URL de producción: https://www.triex.app
 *
 * Variables de entorno para tests de autenticación (crear .env.test):
 *   TEST_USER_EMAIL     = email de un usuario pasajero válido
 *   TEST_USER_PASSWORD  = contraseña de ese usuario
 *   TEST_ADMIN_EMAIL    = email de un usuario admin/operador
 *   TEST_ADMIN_PASSWORD = contraseña del admin
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    /* URL base de producción */
    baseURL: 'https://www.triex.app',

    /* Captura screenshot en cada fallo */
    screenshot: 'only-on-failure',

    /* Trace completo en primer reintento */
    trace: 'on-first-retry',

    /* Video en fallos */
    video: 'retain-on-failure',

    /* Timeout por acción (10s) */
    actionTimeout: 10_000,

    /* Timeout de navegación (30s) */
    navigationTimeout: 30_000,
  },

  /* Timeout global por test (45s) */
  timeout: 45_000,

  /* Proyectos por navegador */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* Mobile */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
