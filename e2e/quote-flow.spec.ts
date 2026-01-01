import { test, expect } from '@playwright/test';

// Credentials for a user with MANAGER or ADMIN role
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test-admin@example.com',
  password: process.env.TEST_USER_PASSWORD || 'Test123!',
};

test.describe('Quote Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Listen to browser console logs
    page.on('console', (msg) => console.log(`[Browser Console] ${msg.text()}`));

    // Login before each test
    await page.goto('/signin');
    await page.getByLabel('Email').fill(TEST_USER.email);
    await page.getByLabel('Password').fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click({ force: true });

    // Wait for redirect to dashboard or home
    await expect(page).not.toHaveURL('/signin');
    console.log('Login passed, current URL:', page.url());
  });

  test('Full quote lifecycle: Create -> Send -> Accept -> Convert', async ({ page }) => {
    // 1. Navigate to Quotes
    await page.goto('/finances/quotes');
    console.log('Navigated to quotes, current URL:', page.url());
    await expect(page.getByRole('heading', { name: /Quotes/i })).toBeVisible({ timeout: 10000 });

    // 2. Create new quote (Draft)
    await page.getByRole('button', { name: /new quote/i }).click();
    await expect(page).toHaveURL(/\/finances\/quotes\/new/);

    // Fill form
    // Assuming there's a customer selector
    await page.getByRole('combobox', { name: /customer/i }).click();
    await page.getByRole('option').first().click(); // Select first available customer

    await page.locator('[name="items.0.description"]').fill('Custom Development Project');
    await page.locator('[name="items.0.quantity"]').fill('1');
    await page.locator('[name="items.0.unitPrice"]').fill('5000');

    await page.getByRole('button', { name: /create quote/i }).click();

    // Expect redirect to quote details
    await expect(page).toHaveURL(/\/finances\/quotes\/[a-zA-Z0-9]+/);

    // Verify Draft status
    await expect(page.getByText('DRAFT', { exact: true })).toBeVisible();

    // 3. Edit Quote (if needed, optional path)

    // 4. Mark as Sent
    await page.getByRole('button', { name: /mark as sent/i }).click();
    // Confirm modal if exists (Quote status change might just be direct or have confirmation)
    // If confirmation modal:
    // await page.getByRole('button', { name: /confirm/i }).click();

    await expect(page.getByText('SENT', { exact: true })).toBeVisible();

    // 5. Customer Accepts (Simulate via Admin UI "Mark as Accepted")
    // Quote actions menu might be under a "Actions" dropdown or similar if not primary button
    const actionsButton = page.getByRole('button', { name: /actions/i });
    if (await actionsButton.isVisible()) {
      await actionsButton.click();
      await page.getByRole('menuitem', { name: /mark as accepted/i }).click();
    } else {
      // Look for direct button if exposed
      const acceptButton = page.getByRole('button', { name: /mark as accepted/i });
      if (await acceptButton.isVisible()) {
        await acceptButton.click();
      } else {
        // Maybe needs to be "Mark as Accepted" from dropdown
        // Try searching just by text if role is ambiguous
        await page.getByText(/mark as accepted/i).click();
      }
    }

    await expect(page.getByText('ACCEPTED', { exact: true })).toBeVisible();

    // 6. Convert to Invoice
    await page.getByRole('button', { name: /convert to invoice/i }).click();

    // Confirm conversion if modal exists
    const confirmConvert = page.getByRole('button', { name: /convert/i, exact: true });
    if (await confirmConvert.isVisible()) {
      await confirmConvert.click();
    }

    // Should redirect to the new invoice
    await expect(page).toHaveURL(/\/finances\/invoices\/[a-zA-Z0-9]+/);

    // 7. Verify Invoice Created from Quote
    await expect(page.getByText('DRAFT', { exact: true })).toBeVisible(); // Starts as draft invoice usually
    await expect(page.getByText('Custom Development Project')).toBeVisible(); // Item preserved
  });
});
