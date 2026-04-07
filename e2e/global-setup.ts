/**
 * Playwright Global Setup
 *
 * Logs in once and saves the browser auth state to disk.
 * All tests reuse this state via storageState — no login in beforeEach.
 */

import { chromium, expect } from '@playwright/test';
import { config } from 'dotenv';
import fs from 'fs';

config({ path: '.env' });

const BASE_URL = 'http://localhost:3000';

export default async function globalSetup() {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error('E2E_EMAIL and E2E_PASSWORD must be set in .env before running e2e tests');
  }

  fs.mkdirSync('e2e/.auth', { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/signin`);

  await page.getByLabel('Email').fill(email);
  await page.locator('[name="password"]').fill(password);

  const signInButton = page.getByRole('button', { name: /sign in/i });
  await signInButton.waitFor({ state: 'visible' });
  await expect(signInButton).toBeEnabled({ timeout: 30_000 });

  // Wait for the NextAuth credentials callback to respond before doing anything else
  const credentialsResponsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/auth/callback/credentials'),
    { timeout: 15_000 },
  );

  await signInButton.click();
  const credentialsResponse = await credentialsResponsePromise;

  if (!credentialsResponse.ok()) {
    const body = await credentialsResponse.text().catch(() => '(unreadable)');
    throw new Error(
      `Credentials sign-in request failed: HTTP ${credentialsResponse.status()} — ${body}`,
    );
  }

  const responseBody = await credentialsResponse.json().catch(() => null);
  if (responseBody && responseBody.error) {
    throw new Error(`Credentials sign-in rejected: ${responseBody.error}`);
  }

  // Navigate directly to a known protected page now that cookies are set
  await page.goto(`${BASE_URL}/crm/customers`, { waitUntil: 'domcontentloaded' });

  // Verify we are not redirected back to sign-in
  await expect(page).not.toHaveURL(/signin/);

  await context.storageState({ path: 'e2e/.auth/session.json' });

  await browser.close();
}
