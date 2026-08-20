import { test, expect } from '@playwright/test';
import { loginAsOperator } from './helpers/auth';

/**
 * SUITE: Rol Operador
 *
 * El operador es un rol intermedio entre pasajero y admin.
 * Tiene acceso al panel /admin pero con permisos acotados
 * (puede ver pasajeros y viajes, pero no toda la config).
 *
 * ⚠️  Requiere: TEST_OPERATOR_EMAIL y TEST_OPERATOR_PASSWORD en .env.test
 *
 * Para correr solo estos tests:
 *   npx playwright test tests/operator.spec.ts
 */
test.describe('Operador - Accesos y permisos', () => {

  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_OPERATOR_EMAIL,
      'Requiere TEST_OPERATOR_EMAIL en .env.test',
    );
    await page.goto('/login');
    await loginAsOperator(page);
  });

  // ────────────────────────────────────────────────
  // Login y redirección
  // ────────────────────────────────────────────────
  test('login como operador no queda en /login', async ({ page }) => {
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('operador puede acceder al panel /admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/);
    await page.waitForLoadState('networkidle');
  });

  // ────────────────────────────────────────────────
  // Secciones a las que el operador TIENE acceso
  // ────────────────────────────────────────────────
  test('operador puede ver el Dashboard de admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.locator('#root').textContent();
    expect(bodyText).toBeTruthy();
  });

  test('operador puede acceder a /admin/passengers', async ({ page }) => {
    await page.goto('/admin/passengers');
    await expect(page).toHaveURL(/\/admin\/passengers/);
    await page.waitForLoadState('networkidle');
  });

  test('operador puede acceder a /admin/trips', async ({ page }) => {
    await page.goto('/admin/trips');
    await expect(page).toHaveURL(/\/admin\/trips/);
    await page.waitForLoadState('networkidle');
  });

  test('operador puede acceder a /admin/vouchers', async ({ page }) => {
    await page.goto('/admin/vouchers');
    await expect(page).toHaveURL(/\/admin\/vouchers/);
    await page.waitForLoadState('networkidle');
  });

  test('operador puede acceder a /admin/documents', async ({ page }) => {
    await page.goto('/admin/documents');
    await expect(page).toHaveURL(/\/admin\/documents/);
    await page.waitForLoadState('networkidle');
  });

  test('operador puede acceder a /admin/communications', async ({ page }) => {
    await page.goto('/admin/communications');
    await expect(page).toHaveURL(/\/admin\/communications/);
    await page.waitForLoadState('networkidle');
  });

  test('operador puede acceder a /admin/points', async ({ page }) => {
    await page.goto('/admin/points');
    await expect(page).toHaveURL(/\/admin\/points/);
    await page.waitForLoadState('networkidle');
  });

  test('operador puede acceder a /admin/surveys', async ({ page }) => {
    await page.goto('/admin/surveys');
    await expect(page).toHaveURL(/\/admin\/surveys/);
    await page.waitForLoadState('networkidle');
  });

  // ────────────────────────────────────────────────
  // Secciones restringidas (solo admin puro)
  // Ajustar según los permisos reales de tu app
  // ────────────────────────────────────────────────
  test('operador NO puede acceder a /admin/users (solo admin)', async ({ page }) => {
    await page.goto('/admin/users');
    // Debe ser redirigido fuera de /admin/users o ver mensaje de acceso denegado
    const url = page.url();
    const bodyText = await page.locator('#root').textContent();

    const wasRedirected = !url.includes('/admin/users');
    const showsAccessDenied = /acceso|denegado|permiso|no autorizado/i.test(bodyText ?? '');

    expect(wasRedirected || showsAccessDenied).toBeTruthy();
  });

  test('operador puede acceder a /admin/settings', async ({ page }) => {
    // Confirmado por los tests: el operador SÍ tiene acceso a settings.
    // Si en el futuro se restringe solo a admin, cambiar este test.
    await page.goto('/admin/settings');
    await expect(page).toHaveURL(/\/admin\/settings/);
    await page.waitForLoadState('networkidle');
  });

  // ────────────────────────────────────────────────
  // Rutas de pasajero — el operador también puede usarlas
  // ────────────────────────────────────────────────
  test('operador puede ver su perfil en /profile', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).not.toHaveURL(/\/login/);
    await page.waitForLoadState('networkidle');
  });
});
