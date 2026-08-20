import { test, expect } from '@playwright/test';

/**
 * SUITE: Página de Login
 * URL: https://www.triex.app/login
 *
 * Tests sin necesidad de credenciales reales (solo UI pública).
 */
test.describe('Login - UI y validaciones', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('la página carga correctamente con el título de Triex', async ({ page }) => {
    await expect(page).toHaveTitle(/Triex/i);
  });

  test('muestra el heading "Ingresar"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Ingresar' })).toBeVisible();
  });

  test('muestra el panel izquierdo con características del producto', async ({ page }) => {
    // Solo visible en desktop
    await expect(page.getByText('Itinerario en tiempo real')).toBeVisible();
    await expect(page.getByText('Documentos centralizados')).toBeVisible();
    await expect(page.getByText('Programa de puntos')).toBeVisible();
  });

  test('muestra los dos métodos de acceso: contraseña y Magic Link', async ({ page }) => {
    await expect(page.getByText('Con Contraseña', { exact: false })).toBeVisible();
    await expect(page.getByText('Magic Link', { exact: false })).toBeVisible();
  });

  test('muestra los campos de email y contraseña', async ({ page }) => {
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('muestra el botón "¿Olvidaste tu contraseña?"', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: '¿Olvidaste tu contraseña?' }),
    ).toBeVisible();
  });

  test('muestra el campo de Magic Link y el botón de envío', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'Enviarme enlace de acceso' }),
    ).toBeVisible();
  });

  test('el toggle de visibilidad de contraseña funciona', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    // Inicialmente es password
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click en el botón visibility
    await page.locator('button:has(span.material-symbols-outlined)').first().click();

    // Ahora debería ser text
    await expect(page.locator('input[type="text"]')).toBeVisible();
  });

  test('muestra error con credenciales incorrectas', async ({ page }) => {
    await page.locator('input[type="email"]').first().fill('usuario_invalido@test.com');
    await page.locator('input[type="password"]').fill('contraseña_incorrecta_123');
    await page.getByRole('button', { name: 'Ingresar' }).first().click();

    // Debe aparecer mensaje de error en español
    await expect(
      page.locator('.bg-red-50').getByRole('paragraph'),
    ).toBeVisible({ timeout: 15_000 });

    const errorText = await page.locator('.bg-red-50 p').textContent();
    expect(errorText).toMatch(/email|contraseña|incorrectos|credenciales/i);
  });

  test('el botón "¿Olvidaste tu contraseña?" navega a /reset-password', async ({ page }) => {
    await page.getByRole('button', { name: '¿Olvidaste tu contraseña?' }).click();
    await expect(page).toHaveURL(/\/reset-password/);
  });

  test('el campo Magic Link acepta un email válido', async ({ page }) => {
    const magicEmailInput = page.locator('input[type="email"]').nth(1);
    await magicEmailInput.fill('test@triex.com');
    await expect(magicEmailInput).toHaveValue('test@triex.com');
  });

  test('el footer muestra el copyright de Triex', async ({ page }) => {
    await expect(page.getByText(/© 2026 Triex/)).toBeVisible();
  });

  test('la ruta /login redirige a /login sin bucles', async ({ page }) => {
    await expect(page).toHaveURL(/\/login/);
    // No debe redirigir a ningún otro lado sin autenticación
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
  });
});
