import { test, expect } from '@playwright/test';

const TEST_CUSTOMER = {
  firstName: 'Playwright',
  lastName: 'Test',
  email: `playwright.test+${Date.now()}@example.com`,
  updatedFirstName: 'Updated',
};

const TEST_ORG_NAME = 'E2E Test Organisation';

test.describe('Customer Management Flow', () => {
  test('displays the customers list page', async ({ page }) => {
    await page.goto('/crm/customers');

    await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible();
    await expect(page.getByRole('button', { name: /add customer/i })).toBeVisible();
  });

  test('Create → View → Edit → Delete customer lifecycle', async ({ page }) => {
    await page.goto('/crm/customers');

    // -- Create ---------------------------------------------------------------

    await page.getByRole('button', { name: /add customer/i }).click();
    await expect(page.getByText('New Customer')).toBeVisible();

    await page.getByPlaceholder('Enter first name').fill(TEST_CUSTOMER.firstName);
    await page.getByPlaceholder('Enter last name').fill(TEST_CUSTOMER.lastName);
    await page.getByPlaceholder('john.doe@example.com').fill(TEST_CUSTOMER.email);

    // Select an existing organisation so address becomes optional.
    // Filter by visible text (not accessible name) so we wait out the "Loading organizations..." state.
    await page
      .locator('button[role="combobox"]')
      .filter({ hasText: /select or create an organization/i })
      .click();
    await page.getByPlaceholder('Search organizations...').fill(TEST_ORG_NAME);
    await page.getByRole('option', { name: TEST_ORG_NAME }).click();

    await page.getByRole('button', { name: 'Create Customer' }).click();

    // Scope to the row containing the unique email to avoid matching leftover test data.
    // Use filter({ hasText }) rather than new RegExp(email) — the email contains regex
    // special characters (+ and .) that would break the pattern.
    const customerRow = page.getByRole('row').filter({ hasText: TEST_CUSTOMER.email });
    await expect(customerRow).toBeVisible({ timeout: 10_000 });

    // -- View -----------------------------------------------------------------

    await customerRow
      .getByRole('link', { name: `${TEST_CUSTOMER.firstName} ${TEST_CUSTOMER.lastName}` })
      .click();

    // The link uses a Next.js intercepting route — the URL changes via a soft (client-side)
    // navigation so the 'load' event never fires. Use 'commit' to detect the URL change.
    await page.waitForURL(/\/crm\/customers\/.+/, { timeout: 10_000, waitUntil: 'commit' });
    // Scope to the mailto link to avoid strict mode violation — email appears in both a
    // plain <div> and an <a href="mailto:..."> in the drawer detail view.
    await expect(page.getByRole('link', { name: TEST_CUSTOMER.email })).toBeVisible();

    // -- Edit -----------------------------------------------------------------

    await page.getByRole('button', { name: /^edit$/i }).click();
    await page.getByPlaceholder('Enter first name').fill(TEST_CUSTOMER.updatedFirstName);
    await page.getByRole('button', { name: 'Update Customer' }).click();

    // After update, drawer is still open in view mode — close it to see the refreshed list
    await page.getByRole('button', { name: 'Close' }).click();

    await expect(
      page.getByRole('link', {
        name: `${TEST_CUSTOMER.updatedFirstName} ${TEST_CUSTOMER.lastName}`,
      }),
    ).toBeVisible({ timeout: 10_000 });

    // -- Delete ---------------------------------------------------------------

    // Register dialog handler before triggering the action
    page.on('dialog', (dialog) => dialog.accept());

    // Scope by unique email (same as customerRow) to avoid strict mode violations from leftover data
    const row = page.getByRole('row').filter({ hasText: TEST_CUSTOMER.email });
    await row.getByRole('button', { name: /open menu/i }).click();
    await page.getByRole('menuitem', { name: /delete customer/i }).click();

    await expect(
      page.getByRole('link', {
        name: `${TEST_CUSTOMER.updatedFirstName} ${TEST_CUSTOMER.lastName}`,
      }),
    ).not.toBeVisible({ timeout: 10_000 });
  });

  test('shows validation errors when submitting an empty form', async ({ page }) => {
    await page.goto('/crm/customers');

    await page.getByRole('button', { name: /add customer/i }).click();
    await expect(page.getByText('New Customer')).toBeVisible();

    await page.getByRole('button', { name: 'Create Customer' }).click();

    // Validation error messages appear after submit attempt
    await expect(page.getByText('First name must be at least 2 characters')).toBeVisible();
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
  });

  test('searches and filters customers', async ({ page }) => {
    // Navigate with the search param pre-set to bypass the client-side debounce chain
    // (fill → debounce → nuqs URL update → server re-render) which is too timing-dependent.
    // This directly tests that the server-side filter returns no results for a nonsense query.
    await page.goto('/crm/customers?search=nonexistent-xyz-12345');

    await expect(page.getByText(/no customers found/i)).toBeVisible({ timeout: 10_000 });
  });
});
