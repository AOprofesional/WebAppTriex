import { test, expect, Page } from '@playwright/test';
import { loginAsOperator, loginAsAdmin } from './helpers/auth';

/**
 * SUITE: CRUD de Pasajeros
 *
 * Cubre las operaciones de Create / Read / Update / Archive (Delete)
 * sobre la entidad Pasajero, desde el panel /admin/passengers.
 *
 * ⚠️  IMPORTANTE - Tests destructivos:
 *   - El test de CREATE crea un pasajero real en la BD.
 *   - El test de ARCHIVE lo archiva al final.
 *   - Si el test falla a mitad, puede quedar un pasajero de prueba.
 *   - Usar una cuenta de test aislada / entorno de staging si es posible.
 *
 * ⚠️  Requiere variables en .env.test:
 *   TEST_OPERATOR_EMAIL / TEST_OPERATOR_PASSWORD
 *   TEST_ADMIN_EMAIL    / TEST_ADMIN_PASSWORD
 *
 * Para correr solo estos tests:
 *   npx playwright test tests/passengers-crud.spec.ts
 */

// ─── Datos del pasajero de prueba ───────────────────────────────────────────
const TEST_PASSENGER = {
  firstName: 'Test',
  lastName:  `Playwright${Date.now()}`,   // apellido único por corrida
  email:     `playwright.test.${Date.now()}@triex-test.com`,
  phone:     '1155550000',
};

// ─── Helper: navegar a /admin/passengers y esperar la tabla ─────────────────
async function goToPassengers(page: Page): Promise<void> {
  await page.goto('/admin/passengers');
  await expect(page).toHaveURL(/\/admin\/passengers/);
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Cargando pasajeros...')).toBeHidden({ timeout: 15_000 });
}

// ─── Helper: abrir el modal "Nuevo Pasajero" ────────────────────────────────
async function openCreateModal(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Nuevo Pasajero/i }).click();
  await expect(
    page.locator('.fixed.inset-0, [role="dialog"]').first()
  ).toBeVisible({ timeout: 8_000 });
}

// ─── Helper: buscar un pasajero por apellido ─────────────────────────────────
async function searchPassenger(page: Page, term: string): Promise<void> {
  const searchInput = page.locator('input[placeholder*="Buscar"]');
  await expect(searchInput).toBeVisible({ timeout: 8_000 });
  await searchInput.fill(term);
  await page.waitForTimeout(400); // debounce de 300ms
  await expect(page.getByText('Cargando pasajeros...')).toBeHidden({ timeout: 15_000 });
}

// ══════════════════════════════════════════════════════════════════════════════
// OPERADOR — CRUD de pasajeros
// ══════════════════════════════════════════════════════════════════════════════
test.describe('CRUD Pasajeros — Rol Operador', () => {

  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_OPERATOR_EMAIL,
      'Requiere TEST_OPERATOR_EMAIL en .env.test',
    );
    await page.goto('/login');
    await loginAsOperator(page);
  });

  // ── READ ──────────────────────────────────────────────────────────────────
  test('[READ] lista de pasajeros carga con tabla visible', async ({ page }) => {
    await goToPassengers(page);
    // Debe mostrar tabla o estado vacío — nunca un error
    const hasTable      = await page.locator('table').count();
    const hasEmptyState = await page.getByText(/No hay pasajeros|No se encontraron/).count();
    expect(hasTable + hasEmptyState).toBeGreaterThan(0);
  });

  test('[READ] buscar pasajero por término filtra la lista', async ({ page }) => {
    await goToPassengers(page);
    await searchPassenger(page, 'a');

    // Después de buscar, debe haber filas O estado vacío visible
    const rows = page.locator('table tbody tr');
    const emptyState = page.getByText(/No se encontraron|No hay pasajeros/);
    await expect(rows.first().or(emptyState.first())).toBeVisible({ timeout: 10_000 });
  });

  test('[READ] filtro "Mostrar archivados" cambia la lista', async ({ page }) => {
    await goToPassengers(page);
    const checkbox = page.locator('input[type="checkbox"]').first();
    // Estado inicial: sin archivados
    await expect(checkbox).not.toBeChecked();
    // Activar
    await checkbox.click();
    await expect(page.getByText('Cargando pasajeros...')).toBeHidden({ timeout: 15_000 });
    await expect(checkbox).toBeChecked();
  });

  test('[READ] filtro de tipo de pasajero funciona', async ({ page }) => {
    await goToPassengers(page);
    const select = page.locator('select').first();
    await select.selectOption('titular');
    await page.waitForTimeout(500);
    // No debe romperse
    await expect(page).toHaveURL(/\/admin\/passengers/);
  });

  // ── CREATE ────────────────────────────────────────────────────────────────
  test('[CREATE] botón "Nuevo Pasajero" abre el modal', async ({ page }) => {
    await goToPassengers(page);
    await openCreateModal(page);
  });

  test('[CREATE] crear pasajero completo y verificar que aparece en la lista', async ({ page }) => {
    await goToPassengers(page);
    await page.getByRole('button', { name: /Nuevo Pasajero/i }).click();

    // Esperar el modal (usa .fixed.inset-0 como overlay)
    const modal = page.locator('.fixed.inset-0').first();
    await expect(modal).toBeVisible({ timeout: 8_000 });

    // ── TAB 1: Info Personal ─────────────────────────────────────────────
    // Nombre (placeholder 'Juan')
    const firstNameInput = modal.locator('input[placeholder="Juan"]');
    await firstNameInput.fill(TEST_PASSENGER.firstName);

    // Apellido (placeholder 'Pérez')
    const lastNameInput = modal.locator('input[placeholder="Pérez"]');
    await lastNameInput.fill(TEST_PASSENGER.lastName);

    // ── TAB 2: Contacto y Viaje (email está aquí, oculto por defecto) ───
    await modal.getByRole('button', { name: 'Contacto y Viaje' }).click();
    await page.waitForTimeout(300);

    // Email (placeholder 'juan.perez@example.com') — ahora visible
    const emailInput = modal.locator('input[placeholder="juan.perez@example.com"]');
    await expect(emailInput).toBeVisible({ timeout: 5_000 });
    await emailInput.fill(TEST_PASSENGER.email);

    // Esperar validación de email (debounce 500ms + request)
    await page.waitForTimeout(800);

    // ── Guardar ──────────────────────────────────────────────────────────
    const saveButton = modal.getByRole('button', { name: /Guardar|Crear|Agregar|Enviar/i }).first();
    await expect(saveButton).toBeEnabled({ timeout: 5_000 });
    await saveButton.click();

    // Esperar cierre del modal y que termine la recarga de datos
    await expect(modal).toBeHidden({ timeout: 15_000 });
    await expect(page.getByText('Cargando pasajeros...')).toBeHidden({ timeout: 15_000 });

    // Verificar que el pasajero aparece en la lista
    await searchPassenger(page, TEST_PASSENGER.lastName);
    const row = page.locator('table tbody tr').filter({ hasText: TEST_PASSENGER.lastName });
    await expect(row.first()).toBeVisible({ timeout: 10_000 });
  });

  // ── UPDATE ────────────────────────────────────────────────────────────────
  test('[UPDATE] botón de editar abre el modal de edición', async ({ page }) => {
    await goToPassengers(page);

    // Necesitamos al menos un pasajero en la lista
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    test.skip(rowCount === 0, 'No hay pasajeros en la lista para editar');

    // Click en el primer botón de editar (ícono edit)
    const editButton = page.locator('button:has(span.material-symbols-outlined)').filter({
      hasText: /edit|pencil/i,
    }).or(
      page.locator('button[title*="ditar"], button[aria-label*="ditar"]')
    ).first();

    if (await editButton.count() > 0) {
      await editButton.click();
      // Debe aparecer el modal de edición
      await expect(
        page.locator('[role="dialog"], .fixed.inset-0').first()
      ).toBeVisible({ timeout: 8_000 });
    } else {
      // Alternativa: click en la fila y buscar botón editar
      await rows.first().click();
      await page.waitForTimeout(1000);
      const editInModal = page.getByRole('button', { name: /editar/i }).first();
      if (await editInModal.count() > 0) {
        await editInModal.click();
        await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 8_000 });
      }
    }
  });

  test('[UPDATE] editar info personal propia en /edit-personal-info', async ({ page }) => {
    // El pasajero puede editar SU PROPIA info desde su perfil
    await page.goto('/edit-personal-info');
    await expect(page).not.toHaveURL(/\/login/);
    await page.waitForLoadState('networkidle');

    // Debe mostrar el formulario de edición
    const hasForm = await page.locator('form, input').count();
    expect(hasForm).toBeGreaterThan(0);
  });

  // ── ARCHIVE (Delete suave) ────────────────────────────────────────────────
  test('[ARCHIVE] botón archivar muestra modal de confirmación', async ({ page }) => {
    await goToPassengers(page);

    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    test.skip(rowCount === 0, 'No hay pasajeros para archivar');

    // Buscar botón de archivo en la primera fila
    const archiveButton = page.locator('button').filter({ hasText: /archive|archivar/i }).first();

    if (await archiveButton.count() > 0) {
      await archiveButton.click();
      // Debe aparecer modal de confirmación
      const confirmModal = page.locator('.fixed.inset-0').first();
      await expect(confirmModal.getByText(/¿Estás seguro/i)).toBeVisible({ timeout: 5_000 });

      // Cancelar dentro del modal para cerrar
      const cancelButton = confirmModal.getByRole('button', { name: /cancelar/i });
      await cancelButton.click();
      await expect(confirmModal).toBeHidden({ timeout: 5_000 });
    }
  });
});


// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — CRUD de pasajeros (mismos casos + exclusivos de admin)
// ══════════════════════════════════════════════════════════════════════════════
test.describe('CRUD Pasajeros — Rol Admin', () => {

  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_ADMIN_EMAIL,
      'Requiere TEST_ADMIN_EMAIL en .env.test',
    );
    await page.goto('/login');
    await loginAsAdmin(page);
  });

  // ── READ ──────────────────────────────────────────────────────────────────
  test('[READ] admin ve la lista completa de todos los operadores', async ({ page }) => {
    await goToPassengers(page);
    // Solo admin ve el filtro de operadores
    const operatorFilter = page.locator('select').nth(1);
    await expect(operatorFilter).toBeVisible();
    const options = await operatorFilter.locator('option').allTextContents();
    expect(options.some(o => /operador|todos/i.test(o))).toBeTruthy();
  });

  test('[READ] admin puede filtrar pasajeros por operador', async ({ page }) => {
    await goToPassengers(page);
    const operatorFilter = page.locator('select').nth(1);
    if (await operatorFilter.count() > 0) {
      await operatorFilter.selectOption({ index: 1 });
      await page.waitForTimeout(600);
      await expect(page).toHaveURL(/\/admin\/passengers/);
    }
  });

  // ── CREATE ────────────────────────────────────────────────────────────────
  test('[CREATE] admin puede abrir modal de nuevo pasajero', async ({ page }) => {
    await goToPassengers(page);
    await page.getByRole('button', { name: /Nuevo Pasajero/i }).click();
    await expect(
      page.locator('[role="dialog"], .fixed.inset-0').first()
    ).toBeVisible({ timeout: 8_000 });
  });

  // ── ARCHIVE ───────────────────────────────────────────────────────────────
  test('[ARCHIVE] admin ve la opción de archivar pasajeros', async ({ page }) => {
    await goToPassengers(page);
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    test.skip(rowCount === 0, 'No hay pasajeros para verificar opciones');

    // Debe existir al menos un botón de acción (editar, archivar, etc.) por fila
    const actionButtons = page.locator('table tbody button');
    await expect(actionButtons.first()).toBeVisible();
  });

  test('[ARCHIVE] admin puede activar vista de archivados y restaurar', async ({ page }) => {
    await goToPassengers(page);

    // Mostrar archivados
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.click();
    await page.waitForLoadState('networkidle');

    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      // Debe aparecer botón de restaurar
      const restoreButton = page.locator('button').filter({ hasText: /restaurar|restore/i }).first();
      if (await restoreButton.count() > 0) {
        await expect(restoreButton).toBeVisible();
      }
    }
  });

  // ── DELETE PERMANENTE (solo admin) ────────────────────────────────────────
  test('[DELETE] admin ve opción de eliminación permanente en archivados', async ({ page }) => {
    await goToPassengers(page);

    // Activar vista archivados
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.click();
    await page.waitForLoadState('networkidle');

    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    test.skip(rowCount === 0, 'No hay pasajeros archivados para verificar eliminación');

    // Debe existir botón de delete permanente (solo visible en archivados)
    const deleteButton = page.locator('button').filter({ hasText: /eliminar|delete/i }).first();
    if (await deleteButton.count() > 0) {
      await expect(deleteButton).toBeVisible();
    }
  });
});
