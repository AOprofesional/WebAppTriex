import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

/**
 * SUITE: Panel de Administración
 *
 * ⚠️  Requiere: TEST_ADMIN_EMAIL y TEST_ADMIN_PASSWORD en .env.test
 *
 * Para correr solo estos tests:
 *   npx playwright test tests/admin.spec.ts
 */
test.describe('Admin - Panel de administración', () => {

  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_ADMIN_EMAIL,
      'Requiere TEST_ADMIN_EMAIL en .env.test',
    );
    await page.goto('/login');
    await loginAsAdmin(page);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/);
  });

  // ────────────────────────────────────────────────
  // DASHBOARD
  // ────────────────────────────────────────────────
  test('Dashboard: carga el panel admin en /admin', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin/);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.locator('main').textContent();
    expect(bodyText).toBeTruthy();
  });

  // ────────────────────────────────────────────────
  // PASAJEROS
  // ────────────────────────────────────────────────
  test('Pasajeros: la sección /admin/passengers carga correctamente', async ({ page }) => {
    await page.goto('/admin/passengers');
    await expect(page).toHaveURL(/\/admin\/passengers/);
    await page.waitForLoadState('networkidle');
  });

  test('Pasajeros: muestra alguna tabla o lista de pasajeros', async ({ page }) => {
    await page.goto('/admin/passengers');
    await page.waitForLoadState('networkidle');

    // Debe haber algún elemento de tabla o lista
    const hasTable = await page.locator('table').count();
    const hasList = await page.locator('[role="list"], [role="grid"]').count();
    expect(hasTable + hasList).toBeGreaterThan(0);
  });

  // ────────────────────────────────────────────────
  // VIAJES
  // ────────────────────────────────────────────────
  test('Viajes: la sección /admin/trips carga correctamente', async ({ page }) => {
    await page.goto('/admin/trips');
    await expect(page).toHaveURL(/\/admin\/trips/);
    await page.waitForLoadState('networkidle');
  });

  // ────────────────────────────────────────────────
  // VOUCHERS
  // ────────────────────────────────────────────────
  test('Vouchers: la sección /admin/vouchers carga correctamente', async ({ page }) => {
    await page.goto('/admin/vouchers');
    await expect(page).toHaveURL(/\/admin\/vouchers/);
    await page.waitForLoadState('networkidle');
  });

  // ────────────────────────────────────────────────
  // DOCUMENTOS
  // ────────────────────────────────────────────────
  test('Documentos: la sección /admin/documents carga correctamente', async ({ page }) => {
    await page.goto('/admin/documents');
    await expect(page).toHaveURL(/\/admin\/documents/);
    await page.waitForLoadState('networkidle');
  });

  // ────────────────────────────────────────────────
  // PUNTOS
  // ────────────────────────────────────────────────
  test('Puntos Admin: la sección /admin/points carga correctamente', async ({ page }) => {
    await page.goto('/admin/points');
    await expect(page).toHaveURL(/\/admin\/points/);
    await page.waitForLoadState('networkidle');
  });

  // ────────────────────────────────────────────────
  // COMUNICACIONES
  // ────────────────────────────────────────────────
  test('Comunicaciones: la sección /admin/communications carga correctamente', async ({ page }) => {
    await page.goto('/admin/communications');
    await expect(page).toHaveURL(/\/admin\/communications/);
    await page.waitForLoadState('networkidle');
  });

  // ────────────────────────────────────────────────
  // USUARIOS
  // ────────────────────────────────────────────────
  test('Usuarios: la sección /admin/users carga correctamente', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/admin\/users/);
    await page.waitForLoadState('networkidle');
  });

  // ────────────────────────────────────────────────
  // CONFIGURACIÓN
  // ────────────────────────────────────────────────
  test('Settings: la sección /admin/settings carga correctamente', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page).toHaveURL(/\/admin\/settings/);
    await page.waitForLoadState('networkidle');
  });

  // ────────────────────────────────────────────────
  // ENCUESTAS
  // ────────────────────────────────────────────────
  test('Encuestas: la sección /admin/surveys carga correctamente', async ({ page }) => {
    await page.goto('/admin/surveys');
    await expect(page).toHaveURL(/\/admin\/surveys/);
    await page.waitForLoadState('networkidle');
  });
});
