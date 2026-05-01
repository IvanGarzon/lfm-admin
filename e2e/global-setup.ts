/**
 * Playwright Global Setup
 *
 * 1. Seeds a fresh E2E environment (tenant + user) via seed-e2e-environment.ts.
 * 2. Logs in with the freshly created user and saves browser auth state to disk.
 *    All tests reuse this state via storageState — no login in beforeEach.
 *
 * Handles two sign-in paths:
 *   - Without OTP: user has isTwoFactorEnabled=false (default for fresh e2e user)
 *   - With OTP:    throws a clear error asking you to set E2E_SKIP_OTP=true
 */

import { chromium, expect } from '@playwright/test';
import { config } from 'dotenv';
import fs from 'fs';
import { execSync } from 'child_process';

config({ path: '.env' });

const BASE_URL = 'http://localhost:3000';

// Selector for the OTP input rendered by InputOTP (each slot is an input).
// We detect the presence of any digit input inside the OTP group.
const OTP_INPUT_SELECTOR = 'input[inputmode="numeric"]';

export default async function globalSetup() {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error('E2E_EMAIL and E2E_PASSWORD must be set in .env before running e2e tests');
  }

  // -- Seed environment first so the user exists before we try to log in -----

  execSync('pnpm tsx --env-file=.env prisma/seeds/seed-e2e-environment.ts', { stdio: 'inherit' });

  // -- Log in and save auth state --------------------------------------------

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

  // -- Detect which sign-in path we are on -----------------------------------
  //
  // Path A (no OTP): the credentials callback fires shortly after the click.
  // Path B (OTP):    the OTP input appears instead; credentials callback fires
  //                  only after the code is submitted.
  //
  // We race between the two to decide which branch to take.

  const credentialsCallbackPromise = page.waitForResponse(
    (response) => response.url().includes('/api/auth/callback/credentials'),
    { timeout: 30_000 }
  );

  const otpInputPromise = page
    .locator(OTP_INPUT_SELECTOR)
    .first()
    .waitFor({ state: 'visible', timeout: 5_000 })
    .then(() => 'otp' as const)
    .catch(() => null);

  await signInButton.click();

  // Give the OTP input a moment to appear (or not).
  const otpResult = await otpInputPromise;

  if (otpResult === 'otp') {
    // -- Path B: OTP required --------------------------------------------------
    //
    // The test user has isTwoFactorEnabled=true and E2E_SKIP_OTP was not set.
    // We cannot retrieve the hashed OTP from the database, so instruct the
    // developer to set E2E_SKIP_OTP=true in their .env.
    throw new Error(
      'Sign-in requires OTP verification but E2E_SKIP_OTP is not set.\n' +
        'Add E2E_SKIP_OTP=true to your .env file to bypass OTP for the test user, ' +
        'or use a test account that has isTwoFactorEnabled=false.'
    );
  }

  // -- Path A: no OTP — wait for credentials callback ------------------------

  const credentialsResponse = await credentialsCallbackPromise;

  if (!credentialsResponse.ok()) {
    const body = await credentialsResponse.text().catch(() => '(unreadable)');
    throw new Error(
      `Credentials sign-in request failed: HTTP ${credentialsResponse.status()} — ${body}`
    );
  }

  const responseBody = await credentialsResponse.json().catch(() => null);
  if (responseBody && responseBody.error) {
    throw new Error(`Credentials sign-in rejected: ${responseBody.error}`);
  }

  // After the credentials callback, NextAuth triggers a client-side redirect
  // (router.push to callbackUrl). Wait for the page to leave /signin before
  // issuing our own goto — otherwise the concurrent navigations race and the
  // goto is aborted with ERR_ABORTED.
  await page
    .waitForURL((url) => !url.pathname.includes('/signin'), { timeout: 15_000 })
    .catch(() => {
      // If the page didn't navigate away on its own it is fine — goto below
      // will handle it.
    });

  // Navigate to a known protected page to confirm the session cookie works.
  await page.goto(`${BASE_URL}/crm/customers`, { waitUntil: 'commit' });

  // Verify we are not redirected back to sign-in.
  await expect(page).not.toHaveURL(/signin/);

  await context.storageState({ path: 'e2e/.auth/session.json' });

  await browser.close();
}
