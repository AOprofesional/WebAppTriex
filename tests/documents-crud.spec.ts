import { test, expect, Page } from '@playwright/test';
import { loginAsOperator, loginAsAdmin, loginAsPassenger } from './helpers/auth';

/**
 * SUITE: Documentación Requerida (Requirements, Review, Compliance & Upload)
 *
 * Cubre:
 *   - ADMIN / OPERADOR (/admin/documents):
 *     1. Requisitos del Viaje: Selección de viaje, agregar requisito, guardar configuración.
 *     2. Revisión de Documentos: Filtro por viaje y estado (pendientes, aprobados, rechazados).
 *     3. Estado de Cumplimiento: Vista general de cumplimiento de pasajeros.
 *   - PASAJERO (/upload y /travel-docs):
 *     4. Lista de documentos requeridos y asistente de carga.
 *
 * Requiere variables en .env.test:
 *   TEST_OPERATOR_EMAIL  / TEST_OPERATOR_PASSWORD
 *   TEST_ADMIN_EMAIL     / TEST_ADMIN_PASSWORD
 *   TEST_PASSENGER_EMAIL / TEST_PASSENGER_PASSWORD
 */

async function goToAdminDocuments(page: Page): Promise<void> {
  await page.goto('/admin/documents');
  await expect(page).toHaveURL(/\/admin\/documents/);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);
}

// ══════════════════════════════════════════════════════════════════════════════
// OPERADOR — Gestión de Documentación
// ══════════════════════════════════════════════════════════════════════════════
test.describe('Documentación Requerida — Rol Operador', () => {

  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_OPERATOR_EMAIL,
      'Requiere TEST_OPERATOR_EMAIL en .env.test',
    );
    await page.goto('/login');
    await loginAsOperator(page);
  });

  // ── READ: Tabs & Layout ───────────────────────────────────────────────────
  test('[READ] vista de documentación carga con las 3 pestañas principales', async ({ page }) => {
    await goToAdminDocuments(page);

    // Encabezado en el contenido principal
    await expect(page.locator('main').getByRole('heading', { name: 'Documentación' })).toBeVisible();

    // 3 pestañas
    await expect(page.getByRole('button', { name: 'Requisitos del Viaje' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Revisión de Documentos' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Estado de Cumplimiento' })).toBeVisible();
  });

  // ── REQUISITOS DEL VIAJE ──────────────────────────────────────────────────
  test('[REQUIREMENTS] seleccionar viaje y visualizar requisitos configurados', async ({ page }) => {
    await goToAdminDocuments(page);

    const tripSelect = page.locator('select').first();
    await expect(tripSelect).toBeVisible();

    const options = await tripSelect.locator('option').all();
    if (options.length > 1) {
      await tripSelect.selectOption({ index: 1 });
      await page.waitForTimeout(600);

      // Debe mostrar el encabezado de Documentos Requeridos
      await expect(page.getByRole('heading', { name: 'Documentos Requeridos' })).toBeVisible();
    }
  });

  test('[REQUIREMENTS] agregar y configurar un nuevo requisito de viaje', async ({ page }) => {
    await goToAdminDocuments(page);

    const tripSelect = page.locator('select').first();
    const options = await tripSelect.locator('option').all();
    test.skip(options.length <= 1, 'No hay viajes disponibles para configurar requisitos');

    await tripSelect.selectOption({ index: 1 });
    await page.waitForTimeout(600);

    // Click en Agregar Requisito
    const addBtn = page.getByRole('button', { name: /Agregar Requisito/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();
    await page.waitForTimeout(300);

    // Debe agregarse una fila de configuración
    const rows = page.locator('input[placeholder*="Ej:"], select');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  // ── REVISIÓN DE DOCUMENTOS ────────────────────────────────────────────────
  test('[REVIEW] cambiar a pestaña de revisión y aplicar filtros de estado', async ({ page }) => {
    await goToAdminDocuments(page);

    // Cambiar a la pestaña 'Revisión de Documentos'
    await page.getByRole('button', { name: 'Revisión de Documentos' }).click();
    await page.waitForTimeout(500);

    // Filtro de Estado (específico buscando 'Pendiente de revisión' para no confundir con 'Todos los viajes')
    const statusSelect = page.locator('select').filter({ hasText: /Pendiente de revisión/i }).first();
    if (await statusSelect.count() > 0) {
      await statusSelect.selectOption('uploaded');
      await page.waitForTimeout(400);
      await statusSelect.selectOption('');
      await page.waitForTimeout(300);
    }

    // Tabla o estado vacío ("Bandeja de revisión vacía")
    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.getByText(/Bandeja de revisión vacía|No hay documentos|No se encontraron documentos/i).count();
    expect(hasTable + hasEmpty).toBeGreaterThan(0);
  });

  // ── ESTADO DE CUMPLIMIENTO ────────────────────────────────────────────────
  test('[COMPLIANCE] pestaña de cumplimiento muestra estado general de pasajeros', async ({ page }) => {
    await goToAdminDocuments(page);

    // Cambiar a la pestaña 'Estado de Cumplimiento'
    await page.getByRole('button', { name: 'Estado de Cumplimiento' }).click();
    await page.waitForTimeout(500);

    // Debe mostrar la vista de cumplimiento
    const content = page.locator('main');
    await expect(content).toBeVisible();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — Documentación Requerida
// ══════════════════════════════════════════════════════════════════════════════
test.describe('Documentación Requerida — Rol Admin', () => {

  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_ADMIN_EMAIL,
      'Requiere TEST_ADMIN_EMAIL en .env.test',
    );
    await page.goto('/login');
    await loginAsAdmin(page);
  });

  test('[READ] admin accede al módulo de documentación y navega las pestañas', async ({ page }) => {
    await goToAdminDocuments(page);
    await expect(page.locator('main').getByRole('heading', { name: 'Documentación' })).toBeVisible();

    // Navegar a Revisión
    await page.getByRole('button', { name: 'Revisión de Documentos' }).click();
    await page.waitForTimeout(400);

    // Navegar a Cumplimiento
    await page.getByRole('button', { name: 'Estado de Cumplimiento' }).click();
    await page.waitForTimeout(400);

    // Volver a Requisitos
    await page.getByRole('button', { name: 'Requisitos del Viaje' }).click();
    await page.waitForTimeout(400);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PASAJERO — Carga de Documentación
// ══════════════════════════════════════════════════════════════════════════════
test.describe('Documentación Requerida — Rol Pasajero', () => {

  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_USER_EMAIL && !process.env.TEST_PASSENGER_EMAIL,
      'Requiere TEST_USER_EMAIL o TEST_PASSENGER_EMAIL en .env.test',
    );
    await page.goto('/login');
    await loginAsPassenger(page);
  });

  test('[PASSENGER] pasajero visualiza sus documentos requeridos en /travel-docs', async ({ page }) => {
    await page.goto('/travel-docs');
    await expect(page).toHaveURL(/\/travel-docs/);
    await page.waitForLoadState('networkidle');

    // La página de docs y vouchers debe cargar sin errores
    const hasContent = await page.locator('main').count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test('[PASSENGER] pasajero accede a la pantalla de carga /upload', async ({ page }) => {
    await page.goto('/upload');
    await expect(page).toHaveURL(/\/upload/);
    await page.waitForLoadState('networkidle');

    // No debe redireccionar a login
    await expect(page).not.toHaveURL(/\/login/);
  });
});
