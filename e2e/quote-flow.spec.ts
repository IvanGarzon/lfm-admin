import { execSync } from 'child_process';
import { test, expect } from '@playwright/test';

// Quote-specific seed data (Carol Martinez → QUO-E2E-0001, Dave Nguyen → QUO-E2E-0002)
// is created in beforeAll and removed in afterAll. The e2e tenant itself is owned by
// global-setup / global-teardown.

test.describe('Quotes page', () => {
  // Run tests sequentially — the lifecycle test mutates shared quote data.
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(() => {
    // Teardown first to reset any mutations from a previous run (e.g. lifecycle test
    // leaves QUO-E2E-0001 in ACCEPTED/converted state). Then re-seed deterministic DRAFT quotes.
    execSync('pnpm tsx --env-file=.env prisma/seeds/teardown-e2e-quotes.ts', {
      stdio: 'inherit',
    });
    execSync('pnpm tsx --env-file=.env prisma/seeds/seed-e2e-quotes.ts', { stdio: 'inherit' });
  });

  test('shows quote list on load', async ({ page }) => {
    await page.goto('/finances/quotes');

    // Seeded data means the list view always renders (no empty state).
    await expect(page.getByRole('heading', { name: /Quotes/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /new quote/i })).toBeVisible();
    await expect(page.getByRole('searchbox')).toBeVisible();
  });

  test('search filters the list to matching quotes', async ({ page }) => {
    await page.goto('/finances/quotes');

    const searchInput = page.getByRole('searchbox');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    await searchInput.fill('Carol');

    // URL updates after debounce.
    await expect(page).toHaveURL(/search=Carol/, { timeout: 2_000 });

    // Carol Martinez's row appears; Dave Nguyen's does not.
    await expect(page.getByRole('row').filter({ hasText: /Carol/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('row').filter({ hasText: /Dave/i })).not.toBeVisible();
  });

  test('search param in URL pre-populates the search input', async ({ page }) => {
    await page.goto('/finances/quotes?search=Dave');

    const searchInput = page.getByRole('searchbox');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
    await expect(searchInput).toHaveValue('Dave');

    // Dave Nguyen's row is visible; Carol Martinez's is not.
    await expect(page.getByRole('row').filter({ hasText: /Dave/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('row').filter({ hasText: /Carol/i })).not.toBeVisible();
  });

  test('full lifecycle: DRAFT → SENT → ACCEPTED → Convert to Invoice', async ({ page }) => {
    await page.goto('/finances/quotes');

    // Open QUO-E2E-0001 by clicking its quote number link.
    const quoteLink = page.getByRole('link', { name: 'QUO-E2E-0001' });
    await expect(quoteLink).toBeVisible({ timeout: 10_000 });
    // Resolve the quote URL from the link's href, then navigate directly.
    // Clicking the Next.js Link triggers client-side navigation that relies on
    // the intercepting route — Playwright does not reliably process that
    // soft-navigation within the storageState test context.
    const href = await quoteLink.getAttribute('href');
    await page.goto(href ?? '/finances/quotes');

    // Scope all drawer assertions to the dialog whose heading is the quote number.
    const drawer = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: 'QUO-E2E-0001' }) });

    await expect(drawer).toBeVisible({ timeout: 15_000 });
    await expect(drawer.getByText('Draft', { exact: true })).toBeVisible({ timeout: 10_000 });

    // -- DRAFT → SENT --------------------------------------------------------

    await drawer.getByRole('button', { name: 'More Options' }).click();
    await page.getByRole('menuitem', { name: /send quote/i }).click();

    // EmailPreviewDialog appears — skip sending and mark as sent without email.
    await expect(page.getByRole('button', { name: /Mark as Sent \(No Email\)/i })).toBeVisible({
      timeout: 5_000,
    });
    await page.getByRole('button', { name: /Mark as Sent \(No Email\)/i }).click();

    // Status updates in the drawer once the mutation settles.
    await expect(drawer.getByText('Sent', { exact: true })).toBeVisible({ timeout: 10_000 });

    // -- SENT → ACCEPTED -----------------------------------------------------

    // Accept quote is a direct mutation with no confirmation dialog.
    await drawer.getByRole('button', { name: 'More Options' }).click();
    await page.getByRole('menuitem', { name: /accept quote/i }).click();

    await expect(drawer.getByText('Accepted', { exact: true })).toBeVisible({ timeout: 10_000 });

    // -- ACCEPTED → Invoice --------------------------------------------------

    await drawer.getByRole('button', { name: 'More Options' }).click();
    await page.getByRole('menuitem', { name: /convert to invoice/i }).click();

    // ConvertToInvoiceDialog — submit with default values (due date already set).
    await expect(page.getByRole('heading', { name: 'Convert Quote to Invoice' })).toBeVisible({
      timeout: 5_000,
    });
    await page.getByRole('button', { name: /^Convert to Invoice$/ }).click();

    // Should redirect to the newly created invoice.
    await expect(page).toHaveURL(/\/finances\/invoices\/[a-zA-Z0-9]+/, { timeout: 15_000 });

    // Verify the invoice was created from the quote (starts as DRAFT, preserves item).
    const invoiceDrawer = page.getByRole('dialog');
    await expect(invoiceDrawer.getByText('Draft', { exact: true })).toBeVisible({
      timeout: 10_000,
    });
    await expect(invoiceDrawer.getByText('Floral Arrangement Service')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('Reset button removes search and sort params from URL', async ({ page }) => {
    await page.goto(
      '/finances/quotes?search=Carol&sort=%5B%7B%22id%22%3A%22validUntil%22%2C%22desc%22%3Atrue%7D%5D',
    );

    const resetButton = page.getByRole('button', { name: /reset/i });
    await expect(resetButton).toBeVisible({ timeout: 10_000 });

    await resetButton.click();

    await expect(page).not.toHaveURL(/search=/, { timeout: 3_000 });
    await expect(page).not.toHaveURL(/sort=/, { timeout: 3_000 });

    // Both rows visible again after reset.
    await expect(page.getByRole('row').filter({ hasText: /Carol/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('row').filter({ hasText: /Dave/i })).toBeVisible({
      timeout: 10_000,
    });
  });
});
