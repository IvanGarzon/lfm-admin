import { execSync } from 'child_process';
import { test, expect } from '@playwright/test';

// Invoice-specific seed data (Alice Thornton → INV-E2E-0001, Bob Kellerman → INV-E2E-0002)
// is created in beforeAll and removed in afterAll. The e2e tenant itself is owned by
// global-setup / global-teardown.

test.describe('Invoices page', () => {
  // Run tests sequentially — the lifecycle test mutates shared invoice data.
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(() => {
    // Teardown first to reset any mutations from a previous run (e.g. lifecycle test
    // leaves INV-E2E-0001 in PAID state). Then re-seed deterministic DRAFT invoices.
    execSync('pnpm tsx --env-file=.env prisma/seeds/teardown-e2e-invoices.ts', {
      stdio: 'inherit',
    });
    execSync('pnpm tsx --env-file=.env prisma/seeds/seed-e2e-invoices.ts', { stdio: 'inherit' });
  });

  test('shows invoice list on load', async ({ page }) => {
    await page.goto('/finances/invoices');

    // Seeded data means the list view always renders (no empty state).
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible();
    await expect(page.getByRole('button', { name: /add invoice/i })).toBeVisible();
    await expect(page.getByRole('searchbox')).toBeVisible();
  });

  test('search filters the list to matching invoices', async ({ page }) => {
    await page.goto('/finances/invoices');

    const searchInput = page.getByRole('searchbox');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    await searchInput.fill('Alice');

    // URL updates after debounce.
    await expect(page).toHaveURL(/search=Alice/, { timeout: 2_000 });

    // Alice Thornton's row appears; Bob Kellerman's does not.
    await expect(page.getByRole('row').filter({ hasText: /Alice/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('row').filter({ hasText: /Bob/i })).not.toBeVisible();
  });

  test('search param in URL pre-populates the search input', async ({ page }) => {
    await page.goto('/finances/invoices?search=Bob');

    const searchInput = page.getByRole('searchbox');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
    await expect(searchInput).toHaveValue('Bob');

    // Bob Kellerman's row is visible; Alice Thornton's is not.
    await expect(page.getByRole('row').filter({ hasText: /Bob/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('row').filter({ hasText: /Alice/i })).not.toBeVisible();
  });

  test('full lifecycle: DRAFT → PENDING → PAID', async ({ page }) => {
    await page.goto('/finances/invoices');

    // Open INV-E2E-0001 by clicking its invoice number link.
    const invoiceLink = page.getByRole('link', { name: 'INV-E2E-0001' });
    await expect(invoiceLink).toBeVisible({ timeout: 10_000 });
    // Resolve the invoice URL from the link's href, then navigate directly.
    // Clicking the Next.js Link triggers client-side navigation that relies on
    // the intercepting route (@modal/(.)[id]) — Playwright does not reliably
    // process that soft-navigation within the storageState test context.
    // page.goto() produces an equivalent result via the [id]/page.tsx route.
    const href = await invoiceLink.getAttribute('href');
    await page.goto(href ?? '/finances/invoices');

    // Scope all drawer assertions to the dialog whose heading is the invoice number.
    // This avoids strict-mode locator errors when secondary dialogs (EmailPreviewDialog,
    // MarkAsPendingDialog, SendReceiptDialog) are simultaneously open.
    const drawer = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: 'INV-E2E-0001' }) });

    await expect(drawer).toBeVisible({ timeout: 15_000 });
    await expect(drawer.getByText('Draft', { exact: true })).toBeVisible({ timeout: 10_000 });

    // -- DRAFT → PENDING -------------------------------------------------------

    await drawer.getByRole('button', { name: 'More Options' }).click();
    await page.getByRole('menuitem', { name: /mark as pending/i }).click();

    // EmailPreviewDialog appears — skip sending and just mark as pending.
    await expect(page.getByRole('button', { name: /Mark as Pending \(No Email\)/i })).toBeVisible({
      timeout: 5_000,
    });
    await page.getByRole('button', { name: /Mark as Pending \(No Email\)/i }).click();

    // MarkAsPendingDialog (role="alertdialog") opens as a second confirmation step.
    // Click "Mark as Pending" to trigger the actual mutation.
    const confirmDialog = page.getByRole('alertdialog');
    await expect(confirmDialog).toBeVisible({ timeout: 5_000 });
    await confirmDialog.getByRole('button', { name: /^Mark as Pending$/ }).click();

    // Status updates in the drawer once the mutation settles.
    await expect(drawer.getByText('Pending', { exact: true })).toBeVisible({ timeout: 10_000 });

    // -- PENDING → PAID --------------------------------------------------------

    await drawer.getByRole('button', { name: 'More Options' }).click();
    await page.getByRole('menuitem', { name: /record payment/i }).click();

    // RecordPaymentDialog — fill full amount via the 100% shortcut.
    await expect(page.getByRole('heading', { name: 'Record Payment' })).toBeVisible({
      timeout: 5_000,
    });
    await page.getByRole('button', { name: '100%' }).click();
    await page.getByRole('button', { name: /^Record Payment$/ }).click();

    // After full payment the app opens a SendReceiptDialog — dismiss it so it
    // does not interfere with subsequent assertions.
    await expect(page.getByRole('heading', { name: 'Record Payment' })).not.toBeVisible({
      timeout: 5_000,
    });
    const sendReceiptHeading = page.getByRole('heading', { name: /send receipt/i });
    if (await sendReceiptHeading.isVisible()) {
      await page.keyboard.press('Escape');
      await expect(sendReceiptHeading).not.toBeVisible({ timeout: 3_000 });
    }

    await expect(drawer.getByText('Paid', { exact: true })).toBeVisible({ timeout: 10_000 });
  });

  test('Reset button removes search and sort params from URL', async ({ page }) => {
    await page.goto(
      '/finances/invoices?search=Alice&sort=%5B%7B%22id%22%3A%22dueDate%22%2C%22desc%22%3Atrue%7D%5D',
    );

    const resetButton = page.getByRole('button', { name: /reset/i });
    await expect(resetButton).toBeVisible({ timeout: 10_000 });

    await resetButton.click();

    await expect(page).not.toHaveURL(/search=/, { timeout: 3_000 });
    await expect(page).not.toHaveURL(/sort=/, { timeout: 3_000 });

    // Both rows visible again after reset.
    await expect(page.getByRole('row').filter({ hasText: /Alice/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('row').filter({ hasText: /Bob/i })).toBeVisible({
      timeout: 10_000,
    });
  });
});
