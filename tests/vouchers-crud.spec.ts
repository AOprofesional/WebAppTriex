import { test, expect, Page } from '@playwright/test';
import { loginAsOperator, loginAsAdmin } from './helpers/auth';

/**
 * SUITE: CRUD de Vouchers
 *
 * Cubre las operaciones de:
 *   - READ: Carga de lista, estadísticas por formato, filtros (tipo, formato, viaje, estado) y búsqueda.
 *   - CREATE: Modal "Nuevo Voucher", formulario completo (formato link/externo), guardado y verificación.
 *   - VIEW: Apertura del modal de detalle "Detalle del Voucher".
 *   - UPDATE: Apertura del modal de edición "Editar Voucher".
 *   - ARCHIVE: Confirmación de archivo (ConfirmDialog).
 *   - RESTORE / DELETE: Gestión desde la vista de archivados con rol Administrador.
 *
 * Requiere variables en .env.test:
 *   TEST_OPERATOR_EMAIL / TEST_OPERATOR_PASSWORD
 *   TEST_ADMIN_EMAIL    / TEST_ADMIN_PASSWORD
 */

const TEST_VOUCHER = {
  title: `Voucher Test Playwright ${Date.now()}`,
  url: 'https://triex.app/voucher-test',
  provider: 'Proveedor Test',
  notes: 'Voucher generado por suite automatizada',
};

// Helper: navegar a /admin/vouchers y esperar que termine la carga
async function goToVouchers(page: Page): Promise<void> {
  await page.goto('/admin/vouchers');
  await expect(page).toHaveURL(/\/admin\/vouchers/);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);
}

// ══════════════════════════════════════════════════════════════════════════════
// OPERADOR — CRUD de Vouchers
// ══════════════════════════════════════════════════════════════════════════════
test.describe('CRUD Vouchers — Rol Operador', () => {

  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_OPERATOR_EMAIL,
      'Requiere TEST_OPERATOR_EMAIL en .env.test',
    );
    await page.goto('/login');
    await loginAsOperator(page);
  });

  // ── READ ──────────────────────────────────────────────────────────────────
  test('[READ] vista de vouchers y estadísticas cargan correctamente', async ({ page }) => {
    await goToVouchers(page);

    // Encabezado en el contenido principal
    await expect(page.locator('main').getByRole('heading', { name: 'Vouchers' })).toBeVisible();

    // Tarjetas de estadísticas (Total, PDFs, Imágenes, Enlaces)
    await expect(page.getByText('Total vouchers')).toBeVisible();

    // Tabla o estado vacío
    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.getByText(/No se encontraron vouchers/i).count();
    expect(hasTable + hasEmpty).toBeGreaterThan(0);
  });

  test('[READ] filtros por tipo y formato funcionan sin error', async ({ page }) => {
    await goToVouchers(page);

    // Filtro por Formato (PDF, Imagen, Link)
    const formatSelect = page.locator('select').filter({ hasText: /Todos los formatos|PDF|Imagen/i }).first();
    if (await formatSelect.count() > 0) {
      await formatSelect.selectOption('link');
      await page.waitForTimeout(400);
      await formatSelect.selectOption('');
      await page.waitForTimeout(300);
    }

    // Filtro por Tipo
    const typeSelect = page.locator('select').filter({ hasText: /Todos los tipos/i }).first();
    if (await typeSelect.count() > 0) {
      const options = await typeSelect.locator('option').all();
      if (options.length > 1) {
        await typeSelect.selectOption({ index: 1 });
        await page.waitForTimeout(400);
        await typeSelect.selectOption('');
      }
    }
  });

  test('[READ] conmutar entre vouchers Activos y Archivados', async ({ page }) => {
    await goToVouchers(page);

    const statusSelect = page.locator('select').filter({ hasText: /Activos|Archivados/i }).first();
    if (await statusSelect.count() > 0) {
      // Cambiar a Archivados
      await statusSelect.selectOption('archived');
      await page.waitForTimeout(400);

      // Volver a Activos
      await statusSelect.selectOption('active');
      await page.waitForTimeout(400);
    }
  });

  test('[READ] buscar voucher por término filtra la lista', async ({ page }) => {
    await goToVouchers(page);

    const searchInput = page.locator('input[placeholder*="Buscar"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('a');
    await page.waitForTimeout(500);

    const hasRows = await page.locator('table tbody tr').count();
    expect(hasRows).toBeGreaterThan(0);
  });

  // ── CREATE ────────────────────────────────────────────────────────────────
  test('[CREATE] botón "Nuevo Voucher" abre el modal', async ({ page }) => {
    await goToVouchers(page);
    await page.getByRole('button', { name: /Nuevo Voucher/i }).click();

    // Modal debe ser visible con el encabezado "Nuevo Voucher"
    const modal = page.locator('.fixed.inset-0.z-\\[100\\]').first();
    await expect(modal).toBeVisible({ timeout: 8_000 });
    await expect(modal.getByRole('heading', { name: 'Nuevo Voucher' })).toBeVisible();

    // Cerrar
    await modal.getByRole('button', { name: /Cancelar/i }).click();
    await expect(modal).toBeHidden({ timeout: 5_000 });
  });

  test('[CREATE] crear un voucher completo (formato Link) y verificarlo', async ({ page }) => {
    await goToVouchers(page);
    await page.getByRole('button', { name: /Nuevo Voucher/i }).click();

    const modal = page.locator('.fixed.inset-0.z-\\[100\\]').first();
    await expect(modal).toBeVisible({ timeout: 8_000 });

    // 1. Título
    const titleInput = modal.locator('input[placeholder*="Voucher Hotel"]').first();
    await titleInput.fill(TEST_VOUCHER.title);

    // 2. Tipo de Voucher (esperar que cargue las opciones desde la BD)
    const typeSelect = modal.locator('select').filter({ hasText: /Seleccionar tipo/i }).first();
    await expect(typeSelect.locator('option')).not.toHaveCount(1, { timeout: 10_000 });
    await typeSelect.selectOption({ index: 1 });

    // 3. Formato Link
    const linkRadio = modal.locator('input[value="link"]');
    await linkRadio.click();
    await page.waitForTimeout(300);

    // 4. Seleccionar Viaje (esperar que cargue las opciones)
    const tripSelect = modal.locator('select').filter({ hasText: /Seleccionar viaje/i }).first();
    await expect(tripSelect.locator('option')).not.toHaveCount(1, { timeout: 10_000 });
    await tripSelect.selectOption({ index: 1 });

    // 5. URL Externa
    const urlInput = modal.locator('input[type="url"]').first();
    await expect(urlInput).toBeVisible();
    await urlInput.fill(TEST_VOUCHER.url);

    // 6. Proveedor
    const providerInput = modal.locator('input[placeholder="Ej: Hilton"]').first();
    if (await providerInput.count() > 0) {
      await providerInput.fill(TEST_VOUCHER.provider);
    }

    // 7. Guardar
    const submitBtn = modal.getByRole('button', { name: /Crear Voucher/i });
    await expect(submitBtn).toBeEnabled({ timeout: 5_000 });
    await submitBtn.click();

    // Esperar cierre del modal y recarga de datos
    await expect(modal).toBeHidden({ timeout: 15_000 });
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 15_000 });
    await page.waitForTimeout(600);

    // Buscar el voucher recién creado
    const searchInput = page.locator('input[placeholder*="Buscar"]').first();
    await searchInput.fill(TEST_VOUCHER.title);
    await page.waitForTimeout(600);
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 15_000 });

    const row = page.locator('table tbody tr').filter({ hasText: TEST_VOUCHER.title });
    await expect(row.first()).toBeVisible({ timeout: 10_000 });
  });

  // ── VIEW ──────────────────────────────────────────────────────────────────
  test('[VIEW] abrir modal de vista previa "Detalle del Voucher"', async ({ page }) => {
    await goToVouchers(page);

    const viewBtn = page.locator('button[title="Ver"]').first();
    const count = await viewBtn.count();
    test.skip(count === 0, 'No hay vouchers en la lista para ver');

    await viewBtn.click();

    // Modal de vista
    const modal = page.locator('.fixed.inset-0').first();
    await expect(modal).toBeVisible({ timeout: 8_000 });

    // Cerrar con Escape o botón close
    const closeBtn = modal.locator('button:has([class*="material"]):has-text("close")').first();
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
  });

  // ── UPDATE ────────────────────────────────────────────────────────────────
  test('[UPDATE] abrir modal de edición "Editar Voucher"', async ({ page }) => {
    await goToVouchers(page);

    const editBtn = page.locator('button[title="Editar"]').first();
    const count = await editBtn.count();
    test.skip(count === 0, 'No hay vouchers en la lista para editar');

    await editBtn.click();

    // Modal en modo "Editar Voucher"
    const modal = page.locator('.fixed.inset-0.z-\\[100\\]').first();
    await expect(modal).toBeVisible({ timeout: 8_000 });
    await expect(modal.getByRole('heading', { name: 'Editar Voucher' })).toBeVisible();

    // Cancelar
    await modal.getByRole('button', { name: /Cancelar/i }).click();
    await expect(modal).toBeHidden({ timeout: 5_000 });
  });

  // ── ARCHIVE ───────────────────────────────────────────────────────────────
  test('[ARCHIVE] botón archivar muestra diálogo de confirmación', async ({ page }) => {
    await goToVouchers(page);

    const archiveBtn = page.locator('button[title="Archivar"]').first();
    const count = await archiveBtn.count();
    test.skip(count === 0, 'No hay vouchers en la lista para archivar');

    await archiveBtn.click();

    // ConfirmDialog
    const confirmDialog = page.locator('.fixed.inset-0.z-\\[9999\\]').first();
    await expect(confirmDialog.getByText(/Archivar Voucher/i)).toBeVisible({ timeout: 5_000 });

    // Cancelar
    const cancelBtn = confirmDialog.getByRole('button', { name: /Cancelar/i });
    await cancelBtn.click();
    await expect(confirmDialog).toBeHidden({ timeout: 5_000 });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — CRUD de Vouchers
// ══════════════════════════════════════════════════════════════════════════════
test.describe('CRUD Vouchers — Rol Admin', () => {

  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_ADMIN_EMAIL,
      'Requiere TEST_ADMIN_EMAIL en .env.test',
    );
    await page.goto('/login');
    await loginAsAdmin(page);
  });

  test('[READ] admin accede al panel de vouchers', async ({ page }) => {
    await goToVouchers(page);
    await expect(page.locator('main').getByRole('heading', { name: 'Vouchers' })).toBeVisible();
  });

  test('[CREATE] admin puede abrir modal de nuevo voucher', async ({ page }) => {
    await goToVouchers(page);
    await page.getByRole('button', { name: /Nuevo Voucher/i }).click();

    const modal = page.locator('.fixed.inset-0.z-\\[100\\]').first();
    await expect(modal).toBeVisible({ timeout: 8_000 });
    await modal.getByRole('button', { name: /Cancelar/i }).click();
  });

  test('[ARCHIVED] admin visualiza opciones de restauración y eliminación en archivados', async ({ page }) => {
    await goToVouchers(page);

    // Cambiar a archivados
    const statusSelect = page.locator('select').filter({ hasText: /Activos|Archivados/i }).first();
    if (await statusSelect.count() > 0) {
      await statusSelect.selectOption('archived');
      await page.waitForTimeout(400);

      const restoreBtn = page.locator('button[title="Restaurar"]').first();
      const deleteBtn = page.locator('button[title="Eliminar permanentemente"]').first();
      const hasItems = (await restoreBtn.count()) + (await deleteBtn.count());

      if (hasItems > 0) {
        await expect(restoreBtn.or(deleteBtn)).toBeVisible();
      } else {
        await expect(page.getByText(/No se encontraron vouchers/i)).toBeVisible();
      }
    }
  });
});
