import { test, expect } from '@playwright/test';
import { loginAsPassenger, loginAsAdmin } from './helpers/auth';

/**
 * SUITE: Flujos de autenticación end-to-end
 *
 * ⚠️  Requiere variables de entorno en .env.test:
 *     TEST_USER_EMAIL, TEST_USER_PASSWORD
 *     TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD
 *
 * Para correr solo estos tests:
 *   npx playwright test tests/auth.spec.ts
 */
test.describe('Autenticación - Flujos E2E', () => {

  // ────────────────────────────────────────────────
  // Login exitoso como pasajero
  // ────────────────────────────────────────────────
  test('login exitoso como pasajero redirige fuera de /login', async ({ page }) => {
    test.skip(
      !process.env.TEST_USER_EMAIL,
      'Requiere TEST_USER_EMAIL en .env.test',
    );

    await page.goto('/login');
    await loginAsPassenger(page);

    // Debe estar en / o /app (nunca en /login)
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('login como pasajero muestra la navegación principal', async ({ page }) => {
    test.skip(
      !process.env.TEST_USER_EMAIL,
      'Requiere TEST_USER_EMAIL en .env.test',
    );

    await page.goto('/login');
    await loginAsPassenger(page);

    // El pasajero pasa por /app (RoleRedirect) antes de llegar al home.
    // Navegamos explícitamente a '/' para asegurarnos de que el Layout esté montado.
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // La app usa <aside> para la sidebar en desktop y <div lg:hidden> con BottomNav.
    // Contamos cualquier estructura de navegación visible en el DOM.
    const hasAside = await page.locator('aside').count();
    const hasNav   = await page.locator('nav').count();
    expect(hasAside + hasNav).toBeGreaterThan(0);
  });

  test('login como pasajero NO tiene acceso a /admin', async ({ page }) => {
    test.skip(
      !process.env.TEST_USER_EMAIL,
      'Requiere TEST_USER_EMAIL en .env.test',
    );

    await page.goto('/login');
    await loginAsPassenger(page);

    // Intentar acceder a admin
    await page.goto('/admin');

    // Debe redirigir al home del pasajero, no mostrar panel admin
    await expect(page).not.toHaveURL(/\/admin/);
  });

  // ────────────────────────────────────────────────
  // Login como admin
  // ────────────────────────────────────────────────
  test('login como admin redirige al panel de administración', async ({ page }) => {
    test.skip(
      !process.env.TEST_ADMIN_EMAIL,
      'Requiere TEST_ADMIN_EMAIL en .env.test',
    );

    await page.goto('/login');
    await loginAsAdmin(page);

    // Admin debe terminar en /admin o /app (RoleRedirect)
    await page.waitForURL((url) => !url.pathname.includes('/login'), {
      timeout: 15_000,
    });

    // Navegar a /admin directamente
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/);
  });

  // ────────────────────────────────────────────────
  // Rutas protegidas sin sesión
  // ────────────────────────────────────────────────
  test('acceder a / sin sesión redirige a /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('acceder a /mytrip sin sesión redirige a /login', async ({ page }) => {
    await page.goto('/mytrip');
    await expect(page).toHaveURL(/\/login/);
  });

  test('acceder a /points sin sesión redirige a /login', async ({ page }) => {
    await page.goto('/points');
    await expect(page).toHaveURL(/\/login/);
  });

  test('acceder a /profile sin sesión redirige a /login', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
  });

  test('acceder a /admin sin sesión redirige a /login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  // ────────────────────────────────────────────────
  // Rutas públicas accesibles sin sesión
  // ────────────────────────────────────────────────
  test('/login es accesible sin autenticación', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Ingresar' })).toBeVisible();
  });

  test('/reset-password es accesible sin autenticación', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page).toHaveURL(/\/reset-password/);
  });
});
