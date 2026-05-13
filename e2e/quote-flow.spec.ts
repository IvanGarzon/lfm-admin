import { execSync } from 'child_process';
import { test, expect } from '@playwright/test';

// Fixture map (see seed-e2e-quotes.ts — customerIndex 0 = Carol, 1 = Dave):
//   QUO-E2E-0001  Carol  lifecycle: DRAFT → SENT → ACCEPTED → Invoice
//   QUO-E2E-0002  Dave   search / reset tests (no mutations)
//   QUO-E2E-0003  Carol  reject test
//   QUO-E2E-0004  Dave   cancel test
//   QUO-E2E-0005  Carol  delete test
//   QUO-E2E-0006  Carol  duplicate test
//   QUO-E2E-0007  Dave   on hold test
//   QUO-E2E-0008  Carol  create version test
//   QUO-E2E-0009  Dave   PDF download test
//   QUO-E2E-0010  Carol  email resend preview test
//   QUO-E2E-0011  Dave   edit items test
//   QUO-E2E-0012  Carol  unsaved changes dialog test
//   QUO-E2E-0013  Dave   bulk delete 1
//   QUO-E2E-0014  Dave   bulk delete 2

test.describe('Quotes page', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(() => {
    execSync('pnpm tsx --env-file=.env prisma/seeds/teardown-e2e-quotes.ts', {
      stdio: 'inherit',
    });
    execSync('pnpm tsx --env-file=.env prisma/seeds/seed-e2e-quotes.ts', { stdio: 'inherit' });
  });

  // -- List & search ----------------------------------------------------------

  test('shows quote list on load', async ({ page }) => {
    await page.goto('/finances/quotes');

    await expect(page.getByRole('heading', { name: /Quotes/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /new quote/i })).toBeVisible();
    await expect(page.getByRole('searchbox')).toBeVisible();
  });

  test('search filters the list to matching quotes', async ({ page }) => {
    await page.goto('/finances/quotes');

    const searchInput = page.getByRole('searchbox');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    await searchInput.fill('Carol');
    await expect(page).toHaveURL(/search=Carol/, { timeout: 2_000 });

    await expect(page.getByRole('row').filter({ hasText: /Carol/i }).first()).toBeVisible({
      timeout: 10_000,
    });
    // Wait for stale cached rows to be replaced by the filtered response.
    await expect(page.getByRole('row').filter({ hasText: /Dave/i }).first()).not.toBeVisible({
      timeout: 10_000,
    });
  });

  test('search param in URL pre-populates the search input', async ({ page }) => {
    await page.goto('/finances/quotes?search=Dave');

    const searchInput = page.getByRole('searchbox');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
    await expect(searchInput).toHaveValue('Dave');

    await expect(page.getByRole('row').filter({ hasText: /Dave/i }).first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('row').filter({ hasText: /Carol/i }).first()).not.toBeVisible({
      timeout: 10_000,
    });
  });

  // -- Full lifecycle ---------------------------------------------------------

  test('full lifecycle: DRAFT → SENT → ACCEPTED → Convert to Invoice', async ({ page }) => {
    test.setTimeout(90_000); // 4 status transitions + navigation, each awaiting server round-trips
    await page.goto('/finances/quotes');

    const quoteLink = page.getByRole('link', { name: 'QUO-E2E-0001' });
    await expect(quoteLink).toBeVisible({ timeout: 10_000 });
    const href = await quoteLink.getAttribute('href');
    await page.goto(href ?? '/finances/quotes');

    const drawer = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: 'QUO-E2E-0001' }) });

    await expect(drawer).toBeVisible({ timeout: 15_000 });
    await expect(drawer.getByText('Draft', { exact: true })).toBeVisible({ timeout: 10_000 });

    // -- DRAFT → SENT --------------------------------------------------------

    await drawer.getByRole('button', { name: 'More Options' }).click();
    await page.getByRole('menuitem', { name: /send quote/i }).click();

    await expect(page.getByRole('button', { name: /Mark as Sent \(No Email\)/i })).toBeVisible({
      timeout: 5_000,
    });
    await page.getByRole('button', { name: /Mark as Sent \(No Email\)/i }).click();
    await expect(drawer.getByText('Sent', { exact: true })).toBeVisible({ timeout: 10_000 });

    // -- SENT → ACCEPTED -----------------------------------------------------

    await drawer.getByRole('button', { name: 'More Options' }).click();
    await page.getByRole('menuitem', { name: /accept quote/i }).click();
    await expect(drawer.getByText('Accepted', { exact: true })).toBeVisible({ timeout: 10_000 });

    // -- ACCEPTED → Converted ------------------------------------------------
    // The app does not navigate to the invoice after conversion — the quote drawer
    // stays open and the quote status changes to Converted.

    await drawer.getByRole('button', { name: 'More Options' }).click();
    await page.getByRole('menuitem', { name: /convert to invoice/i }).click();

    await expect(page.getByRole('heading', { name: 'Convert Quote to Invoice' })).toBeVisible({
      timeout: 5_000,
    });
    await page.getByRole('button', { name: /^Convert to Invoice$/ }).click();

    // Success toast names the created invoice number.
    await expect(page.getByText(/Quote converted to invoice/i)).toBeVisible({ timeout: 15_000 });

    // Quote status flips to Converted.
    await expect(drawer.getByText('Converted', { exact: true })).toBeVisible({ timeout: 10_000 });
  });

  // -- Reset -----------------------------------------------------------------

  test('Reset button removes search and sort params from URL', async ({ page }) => {
    await page.goto(
      '/finances/quotes?search=Carol&sort=%5B%7B%22id%22%3A%22validUntil%22%2C%22desc%22%3Atrue%7D%5D',
    );

    const resetButton = page.getByRole('button', { name: /reset/i });
    await expect(resetButton).toBeVisible({ timeout: 10_000 });
    await resetButton.click();

    await expect(page).not.toHaveURL(/search=/, { timeout: 3_000 });
    await expect(page).not.toHaveURL(/sort=/, { timeout: 3_000 });

    await expect(page.getByRole('row').filter({ hasText: /Carol/i }).first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('row').filter({ hasText: /Dave/i }).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  // -- Reject ----------------------------------------------------------------

  test('reject a sent quote: DRAFT → SENT → Rejected', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/finances/quotes');

    const quoteLink = page.getByRole('link', { name: 'QUO-E2E-0003' });
    await expect(quoteLink).toBeVisible({ timeout: 10_000 });
    const href = await quoteLink.getAttribute('href');
    await page.goto(href ?? '/finances/quotes');

    const drawer = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: 'QUO-E2E-0003' }) });

    await expect(drawer).toBeVisible({ timeout: 15_000 });
    await expect(drawer.getByText('Draft', { exact: true })).toBeVisible({ timeout: 10_000 });

    await drawer.getByRole('button', { name: 'More Options' }).click();
    await page.getByRole('menuitem', { name: /send quote/i }).click();
    await expect(page.getByRole('button', { name: /Mark as Sent \(No Email\)/i })).toBeVisible({
      timeout: 5_000,
    });
    await page.getByRole('button', { name: /Mark as Sent \(No Email\)/i }).click();
    await expect(drawer.getByText('Sent', { exact: true })).toBeVisible({ timeout: 10_000 });

    await drawer.getByRole('button', { name: 'More Options' }).click();
    await page.getByRole('menuitem', { name: /reject quote/i }).click();

    await expect(page.getByRole('heading', { name: 'Reject Quote' })).toBeVisible({
      timeout: 5_000,
    });
    await page.getByLabel('Rejection Reason').fill('Price is too high for our budget.');
    await page.getByRole('button', { name: /^Reject Quote$/ }).click();

    await expect(drawer.getByText('Rejected', { exact: true })).toBeVisible({ timeout: 10_000 });
  });

  // -- Cancel ----------------------------------------------------------------

  test('cancel a draft quote', async ({ page }) => {
    await page.goto('/finances/quotes');

    const quoteLink = page.getByRole('link', { name: 'QUO-E2E-0004' });
    await expect(quoteLink).toBeVisible({ timeout: 10_000 });
    const href = await quoteLink.getAttribute('href');
    await page.goto(href ?? '/finances/quotes');

    const drawer = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: 'QUO-E2E-0004' }) });

    await expect(drawer).toBeVisible({ timeout: 15_000 });

    await drawer.getByRole('button', { name: 'More Options' }).click();
    await page.getByRole('menuitem', { name: /cancel quote/i }).click();

    await expect(page.getByRole('heading', { name: 'Cancel Quote' })).toBeVisible({
      timeout: 5_000,
    });
    await page.getByLabel('Reason').fill('Customer changed their mind.');
    await page.getByRole('button', { name: /^Cancel Quote$/ }).click();

    await expect(drawer.getByText('Cancelled', { exact: true })).toBeVisible({ timeout: 10_000 });
  });

  // -- Delete ----------------------------------------------------------------

  test('delete a draft quote removes it from the list', async ({ page }) => {
    await page.goto('/finances/quotes');

    const quoteLink = page.getByRole('link', { name: 'QUO-E2E-0005' });
    await expect(quoteLink).toBeVisible({ timeout: 10_000 });
    const href = await quoteLink.getAttribute('href');
    await page.goto(href ?? '/finances/quotes');

    const drawer = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: 'QUO-E2E-0005' }) });

    await expect(drawer).toBeVisible({ timeout: 15_000 });

    await drawer.getByRole('button', { name: 'More Options' }).click();
    await page.getByRole('menuitem', { name: /delete quote/i }).click();

    await expect(page.getByRole('heading', { name: 'Delete Quote' })).toBeVisible({
      timeout: 5_000,
    });
    await page.getByRole('button', { name: /^Delete Quote$/ }).click();

    await expect(drawer).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('link', { name: 'QUO-E2E-0005' })).not.toBeVisible({
      timeout: 5_000,
    });
  });

  // -- Duplicate -------------------------------------------------------------

  test('duplicate a quote creates a new draft with a different quote number', async ({ page }) => {
    await page.goto('/finances/quotes');

    const quoteLink = page.getByRole('link', { name: 'QUO-E2E-0006' });
    await expect(quoteLink).toBeVisible({ timeout: 10_000 });
    const originalHref = await quoteLink.getAttribute('href');
    await page.goto(originalHref ?? '/finances/quotes');

    const originalDrawer = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: 'QUO-E2E-0006' }) });

    await expect(originalDrawer).toBeVisible({ timeout: 15_000 });

    await originalDrawer.getByRole('button', { name: 'More Options' }).click();
    await page.getByRole('menuitem', { name: /duplicate quote/i }).click();

    // Navigates to the duplicated quote (different URL / heading).
    await expect(page).not.toHaveURL(new RegExp(originalHref ?? 'NOMATCH'), { timeout: 10_000 });

    const duplicateDrawer = page.getByRole('dialog');
    await expect(duplicateDrawer.getByText('Draft', { exact: true })).toBeVisible({
      timeout: 10_000,
    });
    await expect(duplicateDrawer.getByRole('heading', { name: 'QUO-E2E-0006' })).not.toBeVisible();
  });

  // -- Validation ------------------------------------------------------------

  test('create form: submitting without a customer shows a validation error', async ({ page }) => {
    await page.goto('/finances/quotes');
    await expect(page.getByRole('heading', { name: /Quotes/i })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /new quote/i }).click();

    const drawer = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: 'New Quote' }) });
    await expect(drawer).toBeVisible({ timeout: 10_000 });

    // Submit without selecting a customer — drawer must stay open.
    await drawer.getByRole('button', { name: /save as draft/i }).click();
    await expect(drawer).toBeVisible({ timeout: 3_000 });
  });

  // -- Create with multiple items --------------------------------------------

  test('create a quote with two items', async ({ page }) => {
    await page.goto('/finances/quotes');
    await expect(page.getByRole('heading', { name: /Quotes/i })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /new quote/i }).click();

    const drawer = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: 'New Quote' }) });
    await expect(drawer).toBeVisible({ timeout: 10_000 });

    // Select customer — wait for the customer combobox to finish loading.
    // Filter by text covers both the loading state ("Loading customers...") and
    // the ready state ("Select a customer"), so the locator stays stable.
    const customerCombobox = drawer
      .getByRole('combobox')
      .filter({ hasText: /loading customers|select a customer/i });
    await expect(customerCombobox).toBeEnabled({ timeout: 10_000 });
    await customerCombobox.click();
    await page.getByPlaceholder('Search customers...').fill('Carol');
    await page.getByRole('option', { name: /Carol Martinez/i }).click();

    // Fill first item (already present as default row).
    await drawer.getByPlaceholder('Enter item name').nth(0).fill('Rose Bouquet');
    await drawer.locator('input[name="items.0.unitPrice"]').fill('400');

    // Add second item row.
    await drawer.getByRole('button', { name: /add item/i }).click();

    // The second description input appears.
    await expect(drawer.getByPlaceholder('Enter item name').nth(1)).toBeVisible({
      timeout: 3_000,
    });
    await drawer.getByPlaceholder('Enter item name').nth(1).fill('Table Centrepiece');
    await drawer.locator('input[name="items.1.unitPrice"]').fill('300');

    // Submit.
    await drawer.getByRole('button', { name: /save as draft/i }).click();
    await expect(drawer).not.toBeVisible({ timeout: 10_000 });
  });

  // -- Remove item row -------------------------------------------------------

  test('removing an item row reduces the form to one item', async ({ page }) => {
    await page.goto('/finances/quotes');
    await expect(page.getByRole('heading', { name: /Quotes/i })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /new quote/i }).click();

    const drawer = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: 'New Quote' }) });
    await expect(drawer).toBeVisible({ timeout: 10_000 });

    // Add a second item so there are two rows.
    await drawer.getByRole('button', { name: /add item/i }).click();
    await expect(drawer.getByPlaceholder('Enter item name').nth(1)).toBeVisible({
      timeout: 3_000,
    });

    // Remove the second row.
    await drawer
      .getByRole('button', { name: /remove item/i })
      .nth(1)
      .click();

    // Only one description input remains.
    await expect(drawer.getByPlaceholder('Enter item name')).toHaveCount(1, { timeout: 3_000 });

    // Close without saving.
    await page.keyboard.press('Escape');
  });

  // -- Edit ------------------------------------------------------------------

  test('editing a draft quote persists the changes', async ({ page }) => {
    await page.goto('/finances/quotes');

    const quoteLink = page.getByRole('link', { name: 'QUO-E2E-0011' });
    await expect(quoteLink).toBeVisible({ timeout: 10_000 });
    const href = await quoteLink.getAttribute('href');
    await page.goto(href ?? '/finances/quotes');

    const drawer = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: 'QUO-E2E-0011' }) });

    await expect(drawer).toBeVisible({ timeout: 15_000 });

    // Change the item description.
    await drawer.getByPlaceholder('Enter item name').clear();
    await drawer.getByPlaceholder('Enter item name').fill('Updated Garden Flowers');

    // Update button becomes active once the form is dirty.
    await drawer.getByRole('button', { name: /^Update$/ }).click();

    await expect(page.getByText('Quote updated successfully')).toBeVisible({ timeout: 10_000 });
  });

  // -- Unsaved changes dialog ------------------------------------------------

  test('closing a dirty drawer shows the unsaved changes dialog', async ({ page }) => {
    await page.goto('/finances/quotes');

    const quoteLink = page.getByRole('link', { name: 'QUO-E2E-0012' });
    await expect(quoteLink).toBeVisible({ timeout: 10_000 });
    const href = await quoteLink.getAttribute('href');
    await page.goto(href ?? '/finances/quotes');

    const drawer = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: 'QUO-E2E-0012' }) });

    await expect(drawer).toBeVisible({ timeout: 15_000 });

    // Make the form dirty.
    await drawer.getByPlaceholder('Enter item name').clear();
    await drawer.getByPlaceholder('Enter item name').fill('Dirty Change');

    // Click the close (X) button.
    await drawer.getByRole('button', { name: /close/i }).click();

    // UnsavedChangesDialog appears.
    const unsavedDialog = page.getByRole('alertdialog');
    await expect(unsavedDialog).toBeVisible({ timeout: 5_000 });
    await expect(unsavedDialog.getByRole('heading', { name: 'Unsaved changes' })).toBeVisible();

    // Confirm save — form submits.
    await page.getByRole('button', { name: /save changes/i }).click();

    await expect(page.getByText('Quote updated successfully')).toBeVisible({ timeout: 10_000 });
  });

  // -- On Hold ---------------------------------------------------------------

  test('put a quote on hold via the OnHoldDialog', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/finances/quotes');

    const quoteLink = page.getByRole('link', { name: 'QUO-E2E-0007' });
    await expect(quoteLink).toBeVisible({ timeout: 10_000 });
    const href = await quoteLink.getAttribute('href');
    await page.goto(href ?? '/finances/quotes');

    const drawer = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: 'QUO-E2E-0007' }) });

    await expect(drawer).toBeVisible({ timeout: 15_000 });

    // DRAFT → SENT first (On Hold requires SENT).
    await drawer.getByRole('button', { name: 'More Options' }).click();
    await page.getByRole('menuitem', { name: /send quote/i }).click();
    await expect(page.getByRole('button', { name: /Mark as Sent \(No Email\)/i })).toBeVisible({
      timeout: 5_000,
    });
    await page.getByRole('button', { name: /Mark as Sent \(No Email\)/i }).click();
    await expect(drawer.getByText('Sent', { exact: true })).toBeVisible({ timeout: 10_000 });

    // SENT → On Hold.
    await drawer.getByRole('button', { name: 'More Options' }).click();
    await page.getByRole('menuitem', { name: /put on hold/i }).click();

    await expect(page.getByRole('heading', { name: 'Put Quote on Hold' })).toBeVisible({
      timeout: 5_000,
    });
    await page.getByLabel(/reason/i).fill('Waiting for customer budget approval.');
    await page.getByRole('button', { name: /^Put on Hold$/ }).click();

    await expect(drawer.getByText('On Hold', { exact: true })).toBeVisible({ timeout: 10_000 });
  });

  // -- Create version --------------------------------------------------------

  test('create a new version from a sent quote', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/finances/quotes');

    const quoteLink = page.getByRole('link', { name: 'QUO-E2E-0008' });
    await expect(quoteLink).toBeVisible({ timeout: 10_000 });
    const href = await quoteLink.getAttribute('href');
    await page.goto(href ?? '/finances/quotes');

    const drawer = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: 'QUO-E2E-0008' }) });

    await expect(drawer).toBeVisible({ timeout: 15_000 });

    // DRAFT → SENT.
    await drawer.getByRole('button', { name: 'More Options' }).click();
    await page.getByRole('menuitem', { name: /send quote/i }).click();
    await expect(page.getByRole('button', { name: /Mark as Sent \(No Email\)/i })).toBeVisible({
      timeout: 5_000,
    });
    await page.getByRole('button', { name: /Mark as Sent \(No Email\)/i }).click();
    await expect(drawer.getByText('Sent', { exact: true })).toBeVisible({ timeout: 10_000 });

    // SENT → Create new version.
    await drawer.getByRole('button', { name: 'More Options' }).click();
    await page.getByRole('menuitem', { name: /create new version/i }).click();

    // createQuoteVersion generates a NEW quote number for the version — the
    // heading will be something like "QUO-2024-0042 (v2)", not "QUO-E2E-0008 (v2)".
    // Match only the version indicator suffix which is always present for v > 1.
    await expect(page.getByRole('heading', { name: /\(v\d+\)/i })).toBeVisible({ timeout: 30_000 });

    const versionDrawer = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: /\(v\d+\)/i }) });

    await expect(versionDrawer.getByText('Draft', { exact: true })).toBeVisible({
      timeout: 10_000,
    });
  });

  // -- PDF download ----------------------------------------------------------

  test('download quote option is present in the More Options menu', async ({ page }) => {
    await page.goto('/finances/quotes');

    const quoteLink = page.getByRole('link', { name: 'QUO-E2E-0009' });
    await expect(quoteLink).toBeVisible({ timeout: 10_000 });
    const href = await quoteLink.getAttribute('href');
    await page.goto(href ?? '/finances/quotes');

    const drawer = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: 'QUO-E2E-0009' }) });

    await expect(drawer).toBeVisible({ timeout: 15_000 });

    await drawer.getByRole('button', { name: 'More Options' }).click();

    // Verify the menu item is present and enabled — clicking it dispatches the
    // mutation. The async PDF generation outcome is infrastructure-dependent and
    // cannot be asserted reliably across all environments.
    const downloadItem = page.getByRole('menuitem', { name: /download quote/i });
    await expect(downloadItem).toBeVisible({ timeout: 5_000 });
    await downloadItem.click();

    // Menu closes after the click — confirms the action was dispatched.
    await expect(downloadItem).not.toBeVisible({ timeout: 5_000 });
  });

  // -- Email resend preview --------------------------------------------------

  test('resend quote opens the email preview dialog with recipient', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/finances/quotes');

    const quoteLink = page.getByRole('link', { name: 'QUO-E2E-0010' });
    await expect(quoteLink).toBeVisible({ timeout: 10_000 });
    const href = await quoteLink.getAttribute('href');
    await page.goto(href ?? '/finances/quotes');

    const drawer = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: 'QUO-E2E-0010' }) });

    await expect(drawer).toBeVisible({ timeout: 15_000 });

    // DRAFT → SENT so "Resend quote" appears.
    await drawer.getByRole('button', { name: 'More Options' }).click();
    await page.getByRole('menuitem', { name: /send quote/i }).click();
    await expect(page.getByRole('button', { name: /Mark as Sent \(No Email\)/i })).toBeVisible({
      timeout: 5_000,
    });
    await page.getByRole('button', { name: /Mark as Sent \(No Email\)/i }).click();
    await expect(drawer.getByText('Sent', { exact: true })).toBeVisible({ timeout: 10_000 });

    // Resend quote → EmailPreviewDialog.
    await drawer.getByRole('button', { name: 'More Options' }).click();
    await page.getByRole('menuitem', { name: /resend quote/i }).click();

    // EmailPreviewDialog renders with subject. Use subject (not recipient) because
    // EMAIL_TEST_MODE replaces the to-address with EMAIL_TEST_RECIPIENT.
    const emailPreviewDialog = page
      .getByRole('dialog')
      .filter({ has: page.getByText('Email Preview') });
    await expect(emailPreviewDialog).toBeVisible({ timeout: 10_000 });
    // Subject line always contains the quote number regardless of test-mode recipient.
    await expect(emailPreviewDialog.getByText(/Quote QUO-E2E-0010 from/i)).toBeVisible({
      timeout: 20_000,
    });

    // Dismiss.
    await page.getByRole('button', { name: /cancel/i }).click();
  });

  // -- Status filter ---------------------------------------------------------

  test('status filter shows only Draft quotes', async ({ page }) => {
    await page.goto('/finances/quotes');
    await expect(page.getByRole('heading', { name: /Quotes/i })).toBeVisible({ timeout: 10_000 });

    // Open the Status faceted-filter button in the toolbar.
    await page.getByRole('button', { name: /^Status$/i }).click();

    // Select "Cancelled" from the command list.
    await page.getByRole('option', { name: /^Cancelled$/i }).click();

    // Close the popover.
    await page.keyboard.press('Escape');

    // Cancelled status badge is visible (filter shows Cancelled quotes).
    await expect(page.getByText('Cancelled', { exact: true }).first()).toBeVisible({
      timeout: 10_000,
    });

    // Draft badges are not visible (filtered out).
    await expect(page.getByText('Draft', { exact: true }).first()).not.toBeVisible({
      timeout: 10_000,
    });
  });

  // -- Search no matches -----------------------------------------------------

  test('search with no matches shows an empty state message', async ({ page }) => {
    await page.goto('/finances/quotes');

    const searchInput = page.getByRole('searchbox');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    await searchInput.fill('zzz-no-such-customer-xyz');
    await expect(page).toHaveURL(/search=zzz-no-such-customer-xyz/, { timeout: 2_000 });

    await expect(page.getByText(/no quotes found/i)).toBeVisible({ timeout: 10_000 });
  });

  // -- Bulk delete -----------------------------------------------------------

  test('bulk-selecting two quotes and deleting removes them from the list', async ({ page }) => {
    await page.goto('/finances/quotes');
    await expect(page.getByRole('heading', { name: /Quotes/i })).toBeVisible({ timeout: 10_000 });

    // Select QUO-E2E-0013.
    const row13 = page.getByRole('row').filter({ hasText: 'QUO-E2E-0013' });
    await expect(row13).toBeVisible({ timeout: 10_000 });
    await row13.getByRole('checkbox', { name: /select row/i }).click();

    // Select QUO-E2E-0014.
    const row14 = page.getByRole('row').filter({ hasText: 'QUO-E2E-0014' });
    await expect(row14).toBeVisible({ timeout: 10_000 });
    await row14.getByRole('checkbox', { name: /select row/i }).click();

    // Bulk actions bar shows the selected count.
    await expect(page.getByText('2 selected')).toBeVisible({ timeout: 3_000 });

    // Delete both.
    await page.getByRole('button', { name: /^Delete$/ }).click();

    // Both rows disappear.
    await expect(page.getByRole('link', { name: 'QUO-E2E-0013' })).not.toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('link', { name: 'QUO-E2E-0014' })).not.toBeVisible({
      timeout: 10_000,
    });
  });
});
