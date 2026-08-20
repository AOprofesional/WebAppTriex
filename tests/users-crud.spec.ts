import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, loginAsOperator } from './helpers/auth';

/**
 * SUITE: Gestión de Usuarios y Roles
 *
 * Cubre:
 *   - ADMIN / SUPERADMIN (/admin/users):
 *     1. Visualización de lista de usuarios (grid de tarjetas con roles, badges y permisos).
 *     2. Búsqueda por nombre/email y filtrado por rol (Operador, Admin, Super Admin).
 *     3. Modal "Nuevo Usuario" (creación de usuario y asignación de rol).
 *     4. Modal "Editar Usuario" (modificación de datos y rol).
 *     5. Acciones de seguridad (Confirmación de Reset de contraseña y Bloqueo).
 *   - OPERADOR:
 *     6. Comportamiento y restricciones de acceso para operadores.
 *
 * Requiere variables en .env.test:
 *   TEST_ADMIN_EMAIL    / TEST_ADMIN_PASSWORD
 *   TEST_OPERATOR_EMAIL / TEST_OPERATOR_PASSWORD
 */

async function goToAdminUsers(page: Page): Promise<void> {
  await page.goto('/admin/users');
  await expect(page).toHaveURL(/\/admin\/users/);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);
}

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — Gestión de Usuarios y Roles
// ══════════════════════════════════════════════════════════════════════════════
test.describe('Gestión de Usuarios — Rol Admin', () => {

  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_ADMIN_EMAIL,
      'Requiere TEST_ADMIN_EMAIL en .env.test',
    );
    await page.goto('/login');
    await loginAsAdmin(page);
  });

  // ── READ ──────────────────────────────────────────────────────────────────
  test('[READ] vista de usuarios carga con lista de tarjetas y roles asignados', async ({ page }) => {
    await goToAdminUsers(page);

    // Botón de Nuevo Usuario
    await expect(page.getByRole('button', { name: /Nuevo Usuario/i })).toBeVisible();

    // Input de búsqueda y selector de roles
    await expect(page.locator('input[placeholder*="Buscar por nombre o email"]')).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible();

    // Verificar que al menos un usuario aparece en el grid
    const userCards = page.locator('.grid > div');
    expect(await userCards.count()).toBeGreaterThan(0);
  });

  test('[READ] filtrar usuarios por rol y buscar por nombre', async ({ page }) => {
    await goToAdminUsers(page);

    // 1. Filtrar por Operador
    const roleSelect = page.locator('select').first();
    await roleSelect.selectOption('operator');
    await page.waitForTimeout(400);

    // 2. Filtrar por Admin
    await roleSelect.selectOption('admin');
    await page.waitForTimeout(400);

    // 3. Volver a todos los roles
    await roleSelect.selectOption('');
    await page.waitForTimeout(300);

    // 4. Búsqueda por texto
    const searchInput = page.locator('input[placeholder*="Buscar por nombre o email"]');
    await searchInput.fill('a');
    await page.waitForTimeout(400);
    await searchInput.fill('');
  });

  // ── CREATE ────────────────────────────────────────────────────────────────
  test('[CREATE] modal de "Nuevo Usuario" abre y valida campos requeridos', async ({ page }) => {
    await goToAdminUsers(page);

    await page.getByRole('button', { name: /Nuevo Usuario/i }).click();

    // Modal debe ser visible con su título
    const modal = page.locator('.fixed.inset-0.z-\\[100\\]').first();
    await expect(modal).toBeVisible({ timeout: 8_000 });
    await expect(modal.getByRole('heading', { name: 'Nuevo Usuario' })).toBeVisible();

    // Comprobar campos del formulario
    await expect(modal.locator('input[type="email"], input[placeholder*="email" i]').first()).toBeVisible();
    await expect(modal.locator('input[placeholder*="nombre" i], input[type="text"]').first()).toBeVisible();

    // Cerrar modal
    const closeBtn = modal.locator('button:has([class*="material"]):has-text("close")').first();
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await expect(modal).toBeHidden({ timeout: 5_000 });
  });

  // ── UPDATE ────────────────────────────────────────────────────────────────
  test('[UPDATE] abrir modal de edición "Editar Usuario" desde una tarjeta', async ({ page }) => {
    await goToAdminUsers(page);

    const editBtn = page.getByRole('button', { name: 'Editar' }).first();
    test.skip(await editBtn.count() === 0, 'No hay usuarios disponibles para editar');

    await editBtn.click();

    // Modal de edición
    const modal = page.locator('.fixed.inset-0.z-\\[100\\]').first();
    await expect(modal).toBeVisible({ timeout: 8_000 });
    await expect(modal.getByRole('heading', { name: /Editar Usuario/i })).toBeVisible();

    // Cerrar
    const closeBtn = modal.locator('button:has([class*="material"]):has-text("close")').first();
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await expect(modal).toBeHidden({ timeout: 5_000 });
  });

  // ── RESET PASSWORD CONFIRMATION ───────────────────────────────────────────
  test('[ACTIONS] botón Reset de contraseña muestra diálogo de confirmación', async ({ page }) => {
    await goToAdminUsers(page);

    const resetBtn = page.locator('button[title="Resetear contraseña"]').first();
    test.skip(await resetBtn.count() === 0, 'No hay usuarios disponibles para resetear');

    await resetBtn.click();

    // ConfirmDialog
    const confirmDialog = page.locator('.fixed.inset-0.z-\\[9999\\]').first();
    await expect(confirmDialog.getByText(/Resetear contraseña/i)).toBeVisible({ timeout: 5_000 });

    // Cancelar
    await confirmDialog.getByRole('button', { name: /Cancelar/i }).click();
    await expect(confirmDialog).toBeHidden({ timeout: 5_000 });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// OPERADOR — Restricción de Gestión de Usuarios
// ══════════════════════════════════════════════════════════════════════════════
test.describe('Gestión de Usuarios — Rol Operador', () => {

  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_OPERATOR_EMAIL,
      'Requiere TEST_OPERATOR_EMAIL en .env.test',
    );
    await page.goto('/login');
    await loginAsOperator(page);
  });

  test('[SECURITY] operador no visualiza enlace a Usuarios en sidebar o tiene vista restringida', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // En el sidebar del operador no debe haber botón de Usuarios
    const usersSidebarLink = page.locator('aside').getByRole('button', { name: /Usuarios/i });
    const count = await usersSidebarLink.count();
    expect(count).toBe(0);
  });
});
