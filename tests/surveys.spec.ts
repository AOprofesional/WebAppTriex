import { test, expect, Page } from '@playwright/test';
import { loginAsOperator, loginAsAdmin } from './helpers/auth';

/**
 * SUITE: Encuestas de Satisfacción (Post-Viaje e Inicial Pre-Viaje)
 *
 * Cubre:
 *   - ADMIN / OPERADOR (/admin/surveys):
 *     1. Switcher de tipos de encuesta (Post-Viaje / Inicial).
 *     2. Encuesta Post-Viaje (Resumen, Listado de respuestas, filtros de búsqueda, fechas y botón 'Solo detractores').
 *     3. Encuesta Inicial Pre-Viaje (Resumen, Listado y filtros de búsqueda por pasajero).
 *
 * Requiere variables en .env.test:
 *   TEST_OPERATOR_EMAIL / TEST_OPERATOR_PASSWORD
 *   TEST_ADMIN_EMAIL    / TEST_ADMIN_PASSWORD
 */

async function goToAdminSurveys(page: Page): Promise<void> {
  await page.goto('/admin/surveys');
  await expect(page).toHaveURL(/\/admin\/surveys/);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);
}

// ══════════════════════════════════════════════════════════════════════════════
// OPERADOR — Módulo de Encuestas
// ══════════════════════════════════════════════════════════════════════════════
test.describe('Encuestas de Satisfacción — Rol Operador', () => {

  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_OPERATOR_EMAIL,
      'Requiere TEST_OPERATOR_EMAIL en .env.test',
    );
    await page.goto('/login');
    await loginAsOperator(page);
  });

  // ── READ: Layout y Switcher ───────────────────────────────────────────────
  test('[READ] vista de encuestas carga con selector de tipo de encuesta', async ({ page }) => {
    await goToAdminSurveys(page);

    // Botones del switcher de tipo de encuesta
    await expect(page.getByRole('button', { name: /Encuesta Post-Viaje/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Encuesta Inicial/i })).toBeVisible();
  });

  // ── ENCUESTA POST-VIAJE ───────────────────────────────────────────────────
  test('[POST-TRIP] navegar entre pestañas de Resumen y Listado', async ({ page }) => {
    await goToAdminSurveys(page);

    // Click en Listado
    const listBtn = page.getByRole('button', { name: 'Listado' });
    await expect(listBtn).toBeVisible();
    await listBtn.click();
    await page.waitForTimeout(400);

    // Volver a Resumen
    const summaryBtn = page.getByRole('button', { name: 'Resumen' });
    await expect(summaryBtn).toBeVisible();
    await summaryBtn.click();
    await page.waitForTimeout(400);
  });

  test('[POST-TRIP] aplicar filtros de búsqueda y botón Solo Detractores', async ({ page }) => {
    await goToAdminSurveys(page);

    // Filtro de búsqueda
    const searchInput = page.locator('input[placeholder*="Pasajero, destino, código"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('Cancun');
      await page.waitForTimeout(300);
      await searchInput.fill('');
      await page.waitForTimeout(300);
    }

    // Botón Solo detractores
    const detractoresBtn = page.getByRole('button', { name: /Solo detractores/i });
    if (await detractoresBtn.count() > 0) {
      await detractoresBtn.click();
      await page.waitForTimeout(300);
      await detractoresBtn.click();
      await page.waitForTimeout(300);
    }
  });

  // ── ENCUESTA INICIAL (PRE-VIAJE) ──────────────────────────────────────────
  test('[INITIAL] conmutar a Encuesta Inicial y alternar pestañas y filtros', async ({ page }) => {
    await goToAdminSurveys(page);

    // Switch a Encuesta Inicial
    await page.getByRole('button', { name: /Encuesta Inicial/i }).click();
    await page.waitForTimeout(500);

    // Filtro de búsqueda por pasajero
    const searchInput = page.locator('input[placeholder*="Nombre del pasajero"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('a');
      await page.waitForTimeout(300);
      await searchInput.fill('');
    }

    // Alternar a Listado
    const listBtn = page.getByRole('button', { name: 'Listado' });
    if (await listBtn.count() > 0) {
      await listBtn.click();
      await page.waitForTimeout(400);
    }

    // Volver a Resumen
    const summaryBtn = page.getByRole('button', { name: 'Resumen' });
    if (await summaryBtn.count() > 0) {
      await summaryBtn.click();
      await page.waitForTimeout(400);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — Módulo de Encuestas
// ══════════════════════════════════════════════════════════════════════════════
test.describe('Encuestas de Satisfacción — Rol Admin', () => {

  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_ADMIN_EMAIL,
      'Requiere TEST_ADMIN_EMAIL en .env.test',
    );
    await page.goto('/login');
    await loginAsAdmin(page);
  });

  test('[READ] admin accede al módulo de encuestas y navega ambos tipos', async ({ page }) => {
    await goToAdminSurveys(page);

    await expect(page.getByRole('button', { name: /Encuesta Post-Viaje/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Encuesta Inicial/i })).toBeVisible();

    // Conmutar a Inicial
    await page.getByRole('button', { name: /Encuesta Inicial/i }).click();
    await page.waitForTimeout(300);

    // Volver a Post-Viaje
    await page.getByRole('button', { name: /Encuesta Post-Viaje/i }).click();
    await page.waitForTimeout(300);
  });
});
