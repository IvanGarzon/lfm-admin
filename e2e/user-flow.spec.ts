import { execSync } from 'child_process';
import { test, expect } from '@playwright/test';

// Deterministic seed user created by seed-e2e-users.ts.
// beforeAll tears down and re-seeds so any mutation from a previous run is reset.
const E2E_USER = {
  firstName: 'Carol',
  lastName: 'Seed',
  fullName: 'Carol Seed',
  updatedFirstName: 'Updated'
};

test.describe('User Management Flow', () => {
  // Run tests sequentially — the lifecycle test mutates the seeded user.
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(() => {
    execSync('pnpm tsx --env-file=.env prisma/seeds/teardown-e2e-users.ts', { stdio: 'inherit' });
    execSync('pnpm tsx --env-file=.env prisma/seeds/seed-e2e-users.ts', { stdio: 'inherit' });
  });

  test('displays the users list page', async ({ page }) => {
    await page.goto('/users');

    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
    await expect(page.getByRole('button', { name: /invite user/i })).toBeVisible();
    await expect(page.getByRole('searchbox')).toBeVisible();

    // Seed data is present — list must not be in empty state.
    await expect(page.getByRole('row').filter({ hasText: E2E_USER.fullName })).toBeVisible({
      timeout: 10_000
    });
  });

  test('opens the invite modal and closes it with Cancel', async ({ page }) => {
    await page.goto('/users');
    await page.getByRole('button', { name: /invite user/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /invite user/i })).toBeVisible();
    await expect(page.getByText(/send an invitation email/i)).toBeVisible();

    await page.getByRole('button', { name: /cancel/i }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('shows validation errors when submitting the invite form with an invalid email', async ({
    page
  }) => {
    await page.goto('/users');

    await page.getByRole('button', { name: /invite user/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel('Email').fill('not-an-email');
    await page.getByRole('button', { name: /send invitation/i }).click();

    await expect(page.getByText(/please enter a valid email address/i)).toBeVisible({
      timeout: 5_000
    });
  });

  test('searches and filters users', async ({ page }) => {
    // Navigate with the search param pre-set to avoid debounce timing.
    await page.goto('/users?search=nonexistent-xyz-99999');

    await expect(page.getByText(/no users found/i)).toBeVisible({ timeout: 10_000 });
  });

  test('navigates to user details and shows the user drawer', async ({ page }) => {
    await page.goto('/users');

    const userLink = page
      .getByRole('row')
      .filter({ hasText: E2E_USER.fullName })
      .getByRole('link')
      .first();

    await expect(userLink).toBeVisible({ timeout: 10_000 });

    await Promise.all([page.waitForURL(/\/users\/.+/, { timeout: 10_000 }), userLink.click()]);

    await expect(page.getByRole('button', { name: /update user/i })).toBeVisible({
      timeout: 10_000
    });
  });

  test('edits a user first name via the drawer', async ({ page }) => {
    await page.goto('/users');

    const userLink = page
      .getByRole('row')
      .filter({ hasText: E2E_USER.fullName })
      .getByRole('link')
      .first();

    await expect(userLink).toBeVisible({ timeout: 10_000 });

    await Promise.all([page.waitForURL(/\/users\/.+/, { timeout: 10_000 }), userLink.click()]);

    await expect(page.getByLabel('First name')).toBeVisible({ timeout: 10_000 });

    await page.getByLabel('First name').fill(E2E_USER.updatedFirstName);
    await page.getByRole('button', { name: /update user/i }).click();

    await page.goto('/users');

    await expect(
      page.getByRole('link', {
        name: new RegExp(`${E2E_USER.updatedFirstName} ${E2E_USER.lastName}`, 'i')
      })
    ).toBeVisible({ timeout: 10_000 });

    // No manual restore — beforeAll re-seeds on the next run, resetting the name.
  });

  test('navigates to permissions tab and updates the role', async ({ page }) => {
    await page.goto('/users');
    // Wait for data to settle — this test follows another goto('/users') in test 6,
    // and in headed mode the duplicate navigation can leave the table in a loading state.
    // await page.waitForLoadState('networkidle');

    // Filter by last name only — stable regardless of whether test 6 renamed the first name.
    const userLink = page
      .getByRole('row')
      .filter({ hasText: E2E_USER.lastName })
      .getByRole('link')
      .first();

    await expect(userLink).toBeVisible({ timeout: 10_000 });
    await userLink.scrollIntoViewIfNeeded();

    // 20 s timeout — this test follows a duplicate goto('/users') in test 6 which can
    // leave the page in a hydrating state in both headless and headed modes.
    await Promise.all([page.waitForURL(/\/users\/.+/, { timeout: 20_000 }), userLink.click()]);

    await Promise.all([
      page.waitForURL(/\/users\/.+\/permissions/, { timeout: 5_000 }),
      page.getByRole('tab', { name: /permissions/i }).click()
    ]);

    await expect(page.getByRole('heading', { name: /role assignment/i })).toBeVisible({
      timeout: 5_000
    });

    await expect(page.getByText(/select a predefined role to set permissions below/i)).toBeVisible({
      timeout: 10_000
    });

    const drawer = page.getByRole('dialog');

    // Role selector and permission checkboxes must be visible.
    await expect(drawer.getByRole('combobox')).toBeVisible({ timeout: 5_000 });
    await expect(drawer.getByRole('checkbox').first()).toBeVisible({ timeout: 5_000 });

    // Change role to Manager and save.
    await drawer.getByRole('combobox').click();
    await page.getByRole('option', { name: /manager/i }).click();
    await page.getByRole('button', { name: /update user/i }).click();

    // Wait for the mutation to complete before navigating away.
    await expect(page.getByRole('button', { name: /update user/i })).toBeEnabled({
      timeout: 5_000
    });

    // Wait for the permissions data to load before checking the saved role.
    const confirmedDrawer = page.getByRole('dialog');
    await expect(confirmedDrawer.getByRole('combobox')).toBeVisible({ timeout: 10_000 });
    await expect(confirmedDrawer.getByRole('combobox')).toContainText(/manager/i, {
      timeout: 10_000
    });
  });

  test('navigates to security tab and sees active sessions', async ({ page }) => {
    await page.goto('/users');

    // Filter by last name only — stable regardless of first name mutations in earlier tests.
    const userLink = page
      .getByRole('row')
      .filter({ hasText: E2E_USER.lastName })
      .getByRole('link')
      .first();

    await expect(userLink).toBeVisible({ timeout: 10_000 });

    await Promise.all([page.waitForURL(/\/users\/.+/, { timeout: 10_000 }), userLink.click()]);

    await Promise.all([
      page.waitForURL(/\/users\/.+\/security/, { timeout: 5_000 }),
      page.getByRole('tab', { name: /security/i }).click()
    ]);

    await expect(page.getByRole('heading', { name: /active sessions/i })).toBeVisible({
      timeout: 5_000
    });

    // Skeleton must resolve — Carol has no sessions so "No active sessions." must appear.
    await expect(page.getByText(/no active sessions/i)).toBeVisible({ timeout: 10_000 });

    // Security settings — fresh seed has both toggles disabled, so both buttons say "Enable".
    await expect(page.getByText(/two-factor authentication/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/login notifications/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: /^enable$/i })).toHaveCount(2, {
      timeout: 5_000
    });

    // Enable two-factor authentication — first Enable button in DOM order.
    await page
      .getByRole('button', { name: /^enable$/i })
      .first()
      .click();
    await expect(page.getByRole('button', { name: /^disable$/i })).toHaveCount(1, {
      timeout: 5_000
    });

    // Enable login notifications — now the only remaining Enable button.
    await page.getByRole('button', { name: /^enable$/i }).click();
    await expect(page.getByRole('button', { name: /^disable$/i })).toHaveCount(2, {
      timeout: 5_000
    });
  });
});
