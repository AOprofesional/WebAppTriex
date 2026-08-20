import { test, expect, Page } from '@playwright/test';
import { loginAsOperator, loginAsAdmin, loginAsPassenger } from './helpers/auth';

/**
 * SUITE: Orange Pass (Puntos, Miembros, Transacciones y Canjes)
 *
 * Cubre:
 *   - ADMIN / OPERADOR (/admin/points):
 *     1. Estadísticas generales (Puntos en circulación, Miembros activos, Por vencer).
 *     2. Pestaña Miembros (búsqueda, balance de puntos, código de referido).
 *     3. Pestaña Transacciones (historial de puntos acreditados).
 *     4. Pestaña Solicitudes de Canje (filtros por estado).
 *   - PASAJERO (/points):
 *     5. Tarjeta de membresía Orange Pass y balance de puntos.
 *
 * Requiere variables en .env.test:
 *   TEST_OPERATOR_EMAIL  / TEST_OPERATOR_PASSWORD
 *   TEST_ADMIN_EMAIL     / TEST_ADMIN_PASSWORD
 *   TEST_USER_EMAIL      / TEST_USER_PASSWORD (o TEST_PASSENGER_EMAIL)
 */

async function goToAdminPoints(page: Page): Promise<void> {
  await page.goto('/admin/points');
  await expect(page).toHaveURL(/\/admin\/points/);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);
}

// ══════════════════════════════════════════════════════════════════════════════
// OPERADOR — Orange Pass / Gestión de Puntos
// ══════════════════════════════════════════════════════════════════════════════
test.describe('Orange Pass — Rol Operador', () => {

  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_OPERATOR_EMAIL,
      'Requiere TEST_OPERATOR_EMAIL en .env.test',
    );
    await page.goto('/login');
    await loginAsOperator(page);
  });

  // ── READ: Dashboard & Stats ───────────────────────────────────────────────
  test('[READ] vista de puntos y tarjetas de estadísticas cargan correctamente', async ({ page }) => {
    await goToAdminPoints(page);

    // Encabezado en el contenido principal
    await expect(page.locator('main').getByRole('heading', { name: 'Gestión de Puntos' })).toBeVisible();

    // Estadísticas
    await expect(page.getByText('Puntos en Circulación')).toBeVisible();
    await expect(page.getByText('Miembros Activos')).toBeVisible();
    await expect(page.getByText(/Transacciones por Vencer/i)).toBeVisible();
  });

  // ── PESTAÑA MIEMBROS ──────────────────────────────────────────────────────
  test('[MEMBERS] listado de miembros y búsqueda por nombre o código', async ({ page }) => {
    await goToAdminPoints(page);

    // Pestaña Miembros activa por defecto
    const searchInput = page.locator('input[placeholder*="Buscar miembro"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('a');
      await page.waitForTimeout(400);
      await searchInput.fill('');
    }

    // Tabla o estado de carga completado
    const table = page.locator('table');
    if (await table.count() > 0) {
      await expect(table.getByText(/Miembro|Membresía|Balance|Código/i).first()).toBeVisible();
    }
  });

  // ── PESTAÑA TRANSACCIONES ─────────────────────────────────────────────────
  test('[TRANSACTIONS] conmutar a pestaña de transacciones y verificar columnas', async ({ page }) => {
    await goToAdminPoints(page);

    // Click en la pestaña Transacciones
    const txTabBtn = page.getByRole('button', { name: 'Transacciones' });
    await expect(txTabBtn).toBeVisible();
    await txTabBtn.click();
    await page.waitForTimeout(500);

    // Si hay tabla de transacciones, verificar encabezados
    const table = page.locator('table');
    if (await table.count() > 0) {
      await expect(table.getByText(/Fecha|Beneficiario|Motivo|Puntos|Estado/i).first()).toBeVisible();
    }
  });

  // ── PESTAÑA CANJES ────────────────────────────────────────────────────────
  test('[REDEMPTIONS] conmutar a pestaña de solicitudes de canje y alternar filtros', async ({ page }) => {
    await goToAdminPoints(page);

    // Click en Solicitudes de Canje
    const redemptionsTabBtn = page.getByRole('button', { name: /Solicitudes de Canje/i });
    await expect(redemptionsTabBtn).toBeVisible();
    await redemptionsTabBtn.click();
    await page.waitForTimeout(500);

    // Filtros de estado de canje (Pendientes, Completados, Rechazados, Todos)
    const pendingBtn = page.getByRole('button', { name: /Pendientes/i });
    if (await pendingBtn.count() > 0) {
      await pendingBtn.click();
      await page.waitForTimeout(300);
    }

    const allBtn = page.getByRole('button', { name: /Todos/i });
    if (await allBtn.count() > 0) {
      await allBtn.click();
      await page.waitForTimeout(300);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — Orange Pass / Gestión de Puntos
// ══════════════════════════════════════════════════════════════════════════════
test.describe('Orange Pass — Rol Admin', () => {

  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_ADMIN_EMAIL,
      'Requiere TEST_ADMIN_EMAIL en .env.test',
    );
    await page.goto('/login');
    await loginAsAdmin(page);
  });

  test('[READ] admin accede al módulo de puntos y navega entre pestañas', async ({ page }) => {
    await goToAdminPoints(page);
    await expect(page.locator('main').getByRole('heading', { name: 'Gestión de Puntos' })).toBeVisible();

    // Navegar a Transacciones
    await page.getByRole('button', { name: 'Transacciones' }).click();
    await page.waitForTimeout(300);

    // Navegar a Canjes
    await page.getByRole('button', { name: /Solicitudes de Canje/i }).click();
    await page.waitForTimeout(300);

    // Volver a Miembros
    await page.getByRole('button', { name: 'Miembros' }).click();
    await page.waitForTimeout(300);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PASAJERO — Orange Pass / Mis Puntos
// ══════════════════════════════════════════════════════════════════════════════
test.describe('Orange Pass — Rol Pasajero', () => {

  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_USER_EMAIL && !process.env.TEST_PASSENGER_EMAIL,
      'Requiere TEST_USER_EMAIL o TEST_PASSENGER_EMAIL en .env.test',
    );
    await page.goto('/login');
    await loginAsPassenger(page);
  });

  test('[PASSENGER] pasajero accede a /points y visualiza su tarjeta Orange Pass', async ({ page }) => {
    await page.goto('/points');
    await expect(page).toHaveURL(/\/points/);
    await page.waitForLoadState('networkidle');

    // Tarjeta Orange Pass en el contenido principal
    await expect(page.locator('main').getByRole('heading', { name: 'Orange Pass' })).toBeVisible();
    await expect(page.getByText('Programa de Referidos y Puntos')).toBeVisible();
  });
});
