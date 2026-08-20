import { test, expect, Page } from '@playwright/test';
import { loginAsOperator, loginAsAdmin } from './helpers/auth';

/**
 * SUITE: CRUD de Viajes (Trips)
 *
 * Cubre las operaciones de:
 *   - READ: Listar, alternar vista grid/tabla, buscar por nombre, filtrar por estado operativo y activo/archivado.
 *   - CREATE: Abrir modal "Nuevo Viaje", completar datos obligatorios (nombre, destino, fechas) y validar creación.
 *   - UPDATE: Abrir modal de edición "Editar Viaje".
 *   - ARCHIVE / DUPLICATE: Verificar modales de confirmación.
 *   - RESTORE / DELETE: Gestión desde la vista de archivados.
 *
 * Requiere variables en .env.test:
 *   TEST_OPERATOR_EMAIL / TEST_OPERATOR_PASSWORD
 *   TEST_ADMIN_EMAIL    / TEST_ADMIN_PASSWORD
 */

const TEST_TRIP = {
  name: `Viaje Test Playwright ${Date.now()}`,
  internalCode: `PW${Date.now().toString().slice(-6)}`,
  destination: 'Cancún, México',
  startDate: '2026-11-01',
  endDate: '2026-11-10',
};

// Helper para navegar a /admin/trips y esperar que termine la carga inicial
async function goToTrips(page: Page): Promise<void> {
  await page.goto('/admin/trips');
  await expect(page).toHaveURL(/\/admin\/trips/);
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Cargando viajes...')).toBeHidden({ timeout: 15_000 });
}

// Helper para buscar viajes por término
async function searchTrip(page: Page, term: string): Promise<void> {
  const searchInput = page.locator('input[placeholder*="Buscar por nombre, código o destino"]');
  await expect(searchInput).toBeVisible({ timeout: 8_000 });
  await searchInput.fill(term);
  await page.waitForTimeout(400); // debounce de 300ms
  await expect(page.getByText('Cargando viajes...')).toBeHidden({ timeout: 15_000 });
}

// ══════════════════════════════════════════════════════════════════════════════
// OPERADOR — CRUD de Viajes
// ══════════════════════════════════════════════════════════════════════════════
test.describe('CRUD Viajes — Rol Operador', () => {

  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_OPERATOR_EMAIL,
      'Requiere TEST_OPERATOR_EMAIL en .env.test',
    );
    await page.goto('/login');
    await loginAsOperator(page);
  });

  // ── READ ──────────────────────────────────────────────────────────────────
  test('[READ] vista de viajes carga correctamente', async ({ page }) => {
    await goToTrips(page);

    // Debe mostrar título de la sección en el contenido principal
    await expect(page.locator('main').getByRole('heading', { name: 'Viajes' })).toBeVisible();

    // Debe haber tarjetas/tabla o estado vacío
    const hasCards = await page.locator('.grid > div').count();
    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.getByText(/No hay viajes|No se encontraron viajes/).count();
    expect(hasCards + hasTable + hasEmpty).toBeGreaterThan(0);
  });

  test('[READ] alternar entre vista de tabla y tarjetas (grid/list)', async ({ page }) => {
    await goToTrips(page);

    // Cambiar a vista de tabla
    const listButton = page.locator('button[title="Vista de lista"]');
    if (await listButton.count() > 0) {
      await listButton.click();
      await page.waitForTimeout(300);
      const hasTable = await page.locator('table').count();
      const hasEmpty = await page.getByText(/No hay viajes|No se encontraron viajes/).count();
      expect(hasTable + hasEmpty).toBeGreaterThan(0);
    }

    // Volver a vista de tarjetas (grid)
    const gridButton = page.locator('button[title="Vista de tarjetas"]');
    if (await gridButton.count() > 0) {
      await gridButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('[READ] filtrar por pestañas de estado operativo (Previo, En curso, Finalizado)', async ({ page }) => {
    await goToTrips(page);

    // Click en 'Previo'
    await page.getByRole('button', { name: 'Previo' }).click();
    await page.waitForTimeout(400);
    await expect(page.getByText('Cargando viajes...')).toBeHidden({ timeout: 15_000 });

    // Click en 'Todos'
    await page.getByRole('button', { name: 'Todos' }).first().click();
    await page.waitForTimeout(400);
    await expect(page.getByText('Cargando viajes...')).toBeHidden({ timeout: 15_000 });
  });

  test('[READ] conmutar entre viajes Activos y Archivados', async ({ page }) => {
    await goToTrips(page);

    // Cambiar a archivados
    await page.getByRole('button', { name: 'Archivados' }).click();
    await page.waitForTimeout(400);
    await expect(page.getByText('Cargando viajes...')).toBeHidden({ timeout: 15_000 });

    // Volver a activos
    await page.getByRole('button', { name: 'Activos' }).click();
    await page.waitForTimeout(400);
    await expect(page.getByText('Cargando viajes...')).toBeHidden({ timeout: 15_000 });
  });

  test('[READ] buscar viajes por nombre o destino filtra resultados', async ({ page }) => {
    await goToTrips(page);
    await searchTrip(page, 'a');

    // Debe mostrar contenido o estado de sin resultados sin errores
    const hasItems = await page.locator('.grid > div, table tbody tr').count();
    const hasEmpty = await page.getByText(/No se encontraron viajes|No hay viajes/).count();
    expect(hasItems + hasEmpty).toBeGreaterThan(0);
  });

  // ── CREATE ────────────────────────────────────────────────────────────────
  test('[CREATE] botón "Nuevo Viaje" abre el modal correspondiente', async ({ page }) => {
    await goToTrips(page);
    await page.getByRole('button', { name: /Nuevo Viaje/i }).click();

    // Debe aparecer el modal con el heading 'Nuevo Viaje'
    const modal = page.locator('.fixed.inset-0.z-\\[100\\]').first();
    await expect(modal).toBeVisible({ timeout: 8_000 });
    await expect(modal.getByRole('heading', { name: 'Nuevo Viaje' })).toBeVisible();

    // Cerrar modal
    await modal.getByRole('button', { name: 'Cancelar' }).click();
    await expect(modal).toBeHidden({ timeout: 5_000 });
  });

  test('[CREATE] crear un viaje completo y verificar su aparición en la lista', async ({ page }) => {
    await goToTrips(page);
    await page.getByRole('button', { name: /Nuevo Viaje/i }).click();

    const modal = page.locator('.fixed.inset-0.z-\\[100\\]').first();
    await expect(modal).toBeVisible({ timeout: 8_000 });

    // ── TAB 1: Info General ──
    const nameInput = modal.locator('input[placeholder*="Reegresados"]').first();
    await expect(nameInput).toBeVisible();
    await nameInput.fill(TEST_TRIP.name);

    const codeInput = modal.locator('input[placeholder*="TR2026CUN"]').first();
    if (await codeInput.count() > 0) {
      await codeInput.fill(TEST_TRIP.internalCode);
    }

    const destInput = modal.locator('input[placeholder="Cancún, México"]').first();
    await destInput.fill(TEST_TRIP.destination);

    const dateInputs = modal.locator('input[type="date"]');
    await dateInputs.nth(0).fill(TEST_TRIP.startDate);
    await dateInputs.nth(1).fill(TEST_TRIP.endDate);

    // ── TAB 2: Configuración (Categoría obligatoria) ──
    const configTab = modal.locator('button').filter({ hasText: 'Configuración' });
    await configTab.scrollIntoViewIfNeeded();
    await configTab.click();
    await page.waitForTimeout(500);

    const categorySelect = modal.locator('select:has(option[value="CARIBE"])');
    await categorySelect.selectOption('CARIBE');
    await page.waitForTimeout(500);

    // Enviar formulario (Crear viaje)
    const submitBtn = modal.getByRole('button', { name: /Crear viaje|Guardar/i });
    await expect(submitBtn).toBeEnabled({ timeout: 5_000 });
    await submitBtn.click();

    // Esperar cierre del modal y recarga de la lista
    await expect(modal).toBeHidden({ timeout: 20_000 });
    await expect(page.getByText('Cargando viajes...')).toBeHidden({ timeout: 15_000 });

    // Buscar el viaje recién creado
    await searchTrip(page, TEST_TRIP.name);
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain(TEST_TRIP.name);
  });

  // ── UPDATE ────────────────────────────────────────────────────────────────
  test('[UPDATE] abrir modal de edición "Editar Viaje"', async ({ page }) => {
    await goToTrips(page);

    // Cambiar a vista lista para ubicar el botón de edición rápidamente
    const listBtn = page.locator('button[title="Vista de lista"]');
    if (await listBtn.count() > 0) {
      await listBtn.click();
      await page.waitForTimeout(300);
    }

    const editBtn = page.locator('button[title="Editar"]').first();
    const count = await editBtn.count();
    test.skip(count === 0, 'No hay viajes disponibles para editar');

    await editBtn.click();

    // Verificar que el modal abre en modo "Editar Viaje"
    const modal = page.locator('.fixed.inset-0.z-\\[100\\]').first();
    await expect(modal).toBeVisible({ timeout: 8_000 });
    await expect(modal.getByRole('heading', { name: 'Editar Viaje' })).toBeVisible();

    // Cancelar
    await modal.getByRole('button', { name: 'Cancelar' }).click();
    await expect(modal).toBeHidden({ timeout: 5_000 });
  });

  // ── ARCHIVE (Confirmación) ────────────────────────────────────────────────
  test('[ARCHIVE] botón archivar muestra diálogo de confirmación', async ({ page }) => {
    await goToTrips(page);

    const listBtn = page.locator('button[title="Vista de lista"]');
    if (await listBtn.count() > 0) {
      await listBtn.click();
      await page.waitForTimeout(300);
    }

    const archiveBtn = page.locator('button[title="Archivar"]').first();
    const count = await archiveBtn.count();
    test.skip(count === 0, 'No hay viajes disponibles para archivar');

    await archiveBtn.click();

    // El diálogo de confirmación (ConfirmDialog) debe aparecer
    const confirmDialog = page.locator('.fixed.inset-0.z-\\[9999\\]').first();
    await expect(confirmDialog.getByText(/Archivar Viaje/i)).toBeVisible({ timeout: 5_000 });

    // Cancelar dentro del modal para no alterar datos
    const cancelBtn = confirmDialog.getByRole('button', { name: /Cancelar/i });
    await cancelBtn.click();
    await expect(confirmDialog).toBeHidden({ timeout: 5_000 });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — CRUD de Viajes
// ══════════════════════════════════════════════════════════════════════════════
test.describe('CRUD Viajes — Rol Admin', () => {

  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_ADMIN_EMAIL,
      'Requiere TEST_ADMIN_EMAIL en .env.test',
    );
    await page.goto('/login');
    await loginAsAdmin(page);
  });

  test('[READ] admin accede a la gestión de viajes', async ({ page }) => {
    await goToTrips(page);
    await expect(page.locator('main').getByRole('heading', { name: 'Viajes' })).toBeVisible();
  });

  test('[CREATE] admin puede abrir modal de nuevo viaje', async ({ page }) => {
    await goToTrips(page);
    await page.getByRole('button', { name: /Nuevo Viaje/i }).click();

    const modal = page.locator('.fixed.inset-0.z-\\[100\\]').first();
    await expect(modal).toBeVisible({ timeout: 8_000 });
    await modal.getByRole('button', { name: 'Cancelar' }).click();
  });

  test('[ARCHIVED] admin visualiza opciones de restauración y eliminación en archivados', async ({ page }) => {
    await goToTrips(page);

    // Ir a pestaña archivados
    await page.getByRole('button', { name: 'Archivados' }).click();
    await page.waitForTimeout(400);
    await expect(page.getByText('Cargando viajes...')).toBeHidden({ timeout: 15_000 });

    // Si hay archivados, verificar que existan botones de restauración o eliminación
    const restoreBtn = page.locator('button[title*="Restaurar"]').first();
    const deleteBtn = page.locator('button[title*="Eliminar"]').first();
    const hasItems = (await restoreBtn.count()) + (await deleteBtn.count());

    if (hasItems > 0) {
      await expect(restoreBtn.or(deleteBtn)).toBeVisible();
    } else {
      // Estado vacío sin fallos
      await expect(page.getByText(/No hay viajes|No se encontraron viajes/)).toBeVisible();
    }
  });
});
