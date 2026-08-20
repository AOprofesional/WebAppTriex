import { Page, expect } from '@playwright/test';

/**
 * Credenciales de test leídas desde variables de entorno.
 * Crear archivo .env.test en la raíz del proyecto:
 *
 *   TEST_USER_EMAIL=tu@email.com
 *   TEST_USER_PASSWORD=tu_contraseña
 *   TEST_OPERATOR_EMAIL=operador@email.com
 *   TEST_OPERATOR_PASSWORD=operador_contraseña
 *   TEST_ADMIN_EMAIL=admin@email.com
 *   TEST_ADMIN_PASSWORD=admin_contraseña
 */
export const TEST_CREDENTIALS = {
  passenger: {
    email: process.env.TEST_USER_EMAIL ?? '',
    password: process.env.TEST_USER_PASSWORD ?? '',
  },
  operator: {
    email: process.env.TEST_OPERATOR_EMAIL ?? '',
    password: process.env.TEST_OPERATOR_PASSWORD ?? '',
  },
  admin: {
    email: process.env.TEST_ADMIN_EMAIL ?? '',
    password: process.env.TEST_ADMIN_PASSWORD ?? '',
  },
};

/**
 * Realiza el login con email y contraseña desde la página /login.
 */
export async function loginWithPassword(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  if (!page.url().includes('/login')) {
    await page.goto('/login');
  }

  await expect(page.getByRole('heading', { name: 'Ingresar' })).toBeVisible();

  // Primer input type=email es el del form de contraseña
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.fill(email);

  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.fill(password);

  // Botón submit del primer form (Con Contraseña)
  await page.getByRole('button', { name: 'Ingresar' }).first().click();

  // Esperar redirección post-login
  await page.waitForURL(
    (url) => !url.pathname.includes('/login'),
    { timeout: 15_000 },
  );
}

/**
 * Login como pasajero de test.
 * Requiere TEST_USER_EMAIL y TEST_USER_PASSWORD en el entorno.
 */
export async function loginAsPassenger(page: Page): Promise<void> {
  const { email, password } = TEST_CREDENTIALS.passenger;
  if (!email || !password) {
    throw new Error(
      'Faltan variables de entorno: TEST_USER_EMAIL y TEST_USER_PASSWORD',
    );
  }
  await loginWithPassword(page, email, password);
}

/**
 * Login como operador de test.
 * Requiere TEST_OPERATOR_EMAIL y TEST_OPERATOR_PASSWORD en el entorno.
 */
export async function loginAsOperator(page: Page): Promise<void> {
  const { email, password } = TEST_CREDENTIALS.operator;
  if (!email || !password) {
    throw new Error(
      'Faltan variables de entorno: TEST_OPERATOR_EMAIL y TEST_OPERATOR_PASSWORD',
    );
  }
  await loginWithPassword(page, email, password);
}

/**
 * Login como admin de test.
 * Requiere TEST_ADMIN_EMAIL y TEST_ADMIN_PASSWORD en el entorno.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  const { email, password } = TEST_CREDENTIALS.admin;
  if (!email || !password) {
    throw new Error(
      'Faltan variables de entorno: TEST_ADMIN_EMAIL y TEST_ADMIN_PASSWORD',
    );
  }
  await loginWithPassword(page, email, password);
}
