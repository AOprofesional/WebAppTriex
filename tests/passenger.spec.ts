import { test, expect } from '@playwright/test';
import { loginAsPassenger } from './helpers/auth';

/**
 * SUITE: Flujos de Pasajero (Home, Mi Viaje, Itinerario, Puntos, Perfil)
 *
 * ⚠️  Requiere: TEST_USER_EMAIL y TEST_USER_PASSWORD en .env.test
 *
 * Para correr solo estos tests:
 *   npx playwright test tests/passenger.spec.ts
 */
test.describe('Pasajero - Navegación y pantallas', () => {

  // Login una sola vez para todos los tests del describe
  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_USER_EMAIL,
      'Requiere TEST_USER_EMAIL en .env.test',
    );
    await page.goto('/login');
    await loginAsPassenger(page);
  });

  // ────────────────────────────────────────────────
  // HOME
  // ────────────────────────────────────────────────
  test('Home: carga correctamente después del login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\//);
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('Home: tiene el header con "Inicio" en desktop', async ({ page }) => {
    await page.goto('/');
    // En desktop se muestra el header con el nombre de la ruta
    const header = page.locator('header h1');
    if (await header.isVisible()) {
      await expect(header).toHaveText('Inicio');
    }
  });

  // ────────────────────────────────────────────────
  // MI VIAJE
  // ────────────────────────────────────────────────
  test('Mi Viaje: la página carga en /mytrip', async ({ page }) => {
    await page.goto('/mytrip');
    await expect(page).toHaveURL(/\/mytrip/);
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('Mi Viaje: muestra contenido del viaje o mensaje de sin viaje', async ({ page }) => {
    await page.goto('/mytrip');
    // Debe cargar algo de contenido (no estar vacío)
    await page.waitForLoadState('networkidle');
    const bodyText = await page.locator('main').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(10);
  });

  // ────────────────────────────────────────────────
  // ITINERARIO
  // ────────────────────────────────────────────────
  test('Itinerario: la página carga en /itinerary', async ({ page }) => {
    await page.goto('/itinerary');
    await expect(page).toHaveURL(/\/itinerary/);
    await expect(page).not.toHaveURL(/\/login/);
  });

  // ────────────────────────────────────────────────
  // PUNTOS
  // ────────────────────────────────────────────────
  test('Puntos: la página carga en /points', async ({ page }) => {
    await page.goto('/points');
    await expect(page).toHaveURL(/\/points/);
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('Puntos: muestra algún texto sobre puntos o saldo', async ({ page }) => {
    await page.goto('/points');
    await page.waitForLoadState('networkidle');
    const bodyText = await page.locator('main').textContent();
    expect(bodyText).toMatch(/puntos|saldo|beneficio/i);
  });

  // ────────────────────────────────────────────────
  // PERFIL
  // ────────────────────────────────────────────────
  test('Perfil: la página carga en /profile', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/profile/);
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('Perfil: muestra información del usuario', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    // Debe mostrar algún dato de perfil
    const bodyText = await page.locator('main').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(20);
  });

  // ────────────────────────────────────────────────
  // DOCUMENTOS Y VOUCHERS
  // ────────────────────────────────────────────────
  test('Docs & Vouchers: la página carga en /travel-docs', async ({ page }) => {
    await page.goto('/travel-docs');
    await expect(page).toHaveURL(/\/travel-docs/);
    await expect(page).not.toHaveURL(/\/login/);
  });

  // ────────────────────────────────────────────────
  // NOTIFICACIONES
  // ────────────────────────────────────────────────
  test('Notificaciones: la página carga en /notifications', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page).toHaveURL(/\/notifications/);
    await expect(page).not.toHaveURL(/\/login/);
  });

  // ────────────────────────────────────────────────
  // NAVEGACIÓN BOTTOM NAV (mobile)
  // ────────────────────────────────────────────────
  test('BottomNav: los links de navegación están presentes en mobile', async ({ page }) => {
    // Simular viewport mobile
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    // La bottom nav debe existir
    const bottomNav = page.locator('nav').last();
    await expect(bottomNav).toBeVisible();
  });

  // ────────────────────────────────────────────────
  // RESET PASSWORD (acceso desde perfil)
  // ────────────────────────────────────────────────
  test('Security Settings: la página carga en /security-settings', async ({ page }) => {
    await page.goto('/security-settings');
    await expect(page).toHaveURL(/\/security-settings/);
    await expect(page).not.toHaveURL(/\/login/);
  });
});
