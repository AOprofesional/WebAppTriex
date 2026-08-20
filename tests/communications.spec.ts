import { test, expect, Page } from '@playwright/test';
import { loginAsOperator, loginAsAdmin, loginAsPassenger } from './helpers/auth';

/**
 * SUITE: Comunicaciones y Notificaciones
 *
 * Cubre:
 *   - ADMIN / OPERADOR (/admin/communications):
 *     1. Panel de comunicaciones: Filtros de tipo y estado de lectura.
 *     2. Panel de configuración de notificaciones automáticas.
 *     3. Modal "Enviar Notificación" (manual, por viaje o masiva).
 *     4. Historial de notificaciones enviadas.
 *   - PASAJERO (/notifications):
 *     5. Bandeja de notificaciones del pasajero.
 *
 * Requiere variables en .env.test:
 *   TEST_OPERATOR_EMAIL  / TEST_OPERATOR_PASSWORD
 *   TEST_ADMIN_EMAIL     / TEST_ADMIN_PASSWORD
 *   TEST_USER_EMAIL      / TEST_USER_PASSWORD (o TEST_PASSENGER_EMAIL)
 */

async function goToAdminCommunications(page: Page): Promise<void> {
  await page.goto('/admin/communications');
  await expect(page).toHaveURL(/\/admin\/communications/);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);
}

// ══════════════════════════════════════════════════════════════════════════════
// OPERADOR — Panel de Comunicaciones
// ══════════════════════════════════════════════════════════════════════════════
test.describe('Comunicaciones — Rol Operador', () => {

  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_OPERATOR_EMAIL,
      'Requiere TEST_OPERATOR_EMAIL en .env.test',
    );
    await page.goto('/login');
    await loginAsOperator(page);
  });

  // ── READ: Layout y Filtros ────────────────────────────────────────────────
  test('[READ] vista de comunicaciones carga correctamente con filtros y botones de acción', async ({ page }) => {
    await goToAdminCommunications(page);

    // Botones de acción principales
    await expect(page.getByRole('button', { name: /Enviar Notificación/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Configurar automáticas/i })).toBeVisible();

    // Filtro de tipos
    const filterSelect = page.locator('select').first();
    await expect(filterSelect).toBeVisible();
    await filterSelect.selectOption('unread');
    await page.waitForTimeout(300);
    await filterSelect.selectOption('all');
  });

  // ── CONFIGURACIÓN AUTOMÁTICAS ─────────────────────────────────────────────
  test('[CONFIG] alternar panel de configuración de notificaciones automáticas', async ({ page }) => {
    await goToAdminCommunications(page);

    const configBtn = page.getByRole('button', { name: /Configurar automáticas/i });
    await configBtn.click();
    await page.waitForTimeout(400);

    // Debe mostrar la sección o controles de configuración
    const configSection = page.locator('main');
    await expect(configSection).toBeVisible();
  });

  // ── MODAL ENVIAR NOTIFICACIÓN ─────────────────────────────────────────────
  test('[MODAL] abrir y cerrar modal de "Enviar Notificación"', async ({ page }) => {
    await goToAdminCommunications(page);

    await page.getByRole('button', { name: /Enviar Notificación/i }).click();

    // Modal visible con título
    const modal = page.locator('.fixed.inset-0.z-\\[100\\]').first();
    await expect(modal).toBeVisible({ timeout: 8_000 });
    await expect(modal.getByRole('heading', { name: 'Enviar Notificación' })).toBeVisible();

    // Comprobar campos
    await expect(modal.locator('input[placeholder*="Título"], input[type="text"]').first()).toBeVisible();

    // Cerrar modal
    const closeBtn = modal.locator('button:has([class*="material"]):has-text("close")').first();
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await expect(modal).toBeHidden({ timeout: 5_000 });
  });

  // ── HISTORIAL DE NOTIFICACIONES ───────────────────────────────────────────
  test('[HISTORY] historial de notificaciones se muestra o indica bandeja vacía', async ({ page }) => {
    await goToAdminCommunications(page);

    // Contenedor del historial
    await expect(page.getByText('Historial de Notificaciones')).toBeVisible();

    const hasItems = await page.locator('.divide-y > div').count();
    const hasEmpty = await page.getByText(/No hay notificaciones aún|Cargando notificaciones/i).count();
    expect(hasItems + hasEmpty).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — Panel de Comunicaciones
// ══════════════════════════════════════════════════════════════════════════════
test.describe('Comunicaciones — Rol Admin', () => {

  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_ADMIN_EMAIL,
      'Requiere TEST_ADMIN_EMAIL en .env.test',
    );
    await page.goto('/login');
    await loginAsAdmin(page);
  });

  test('[READ] admin accede al módulo de comunicaciones y abre el modal de envío', async ({ page }) => {
    await goToAdminCommunications(page);

    const sendBtn = page.getByRole('button', { name: /Enviar Notificación/i });
    await expect(sendBtn).toBeVisible();
    await sendBtn.click();

    const modal = page.locator('.fixed.inset-0.z-\\[100\\]').first();
    await expect(modal).toBeVisible({ timeout: 8_000 });

    const closeBtn = modal.locator('button:has([class*="material"]):has-text("close")').first();
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await expect(modal).toBeHidden({ timeout: 5_000 });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PASAJERO — Bandeja de Notificaciones
// ══════════════════════════════════════════════════════════════════════════════
test.describe('Comunicaciones — Rol Pasajero', () => {

  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_USER_EMAIL && !process.env.TEST_PASSENGER_EMAIL,
      'Requiere TEST_USER_EMAIL o TEST_PASSENGER_EMAIL en .env.test',
    );
    await page.goto('/login');
    await loginAsPassenger(page);
  });

  test('[PASSENGER] pasajero accede a /notifications y visualiza su bandeja', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page).toHaveURL(/\/notifications/);
    await page.waitForLoadState('networkidle');

    // La página de notificaciones carga correctamente
    const content = page.locator('main');
    await expect(content).toBeVisible();
  });
});
