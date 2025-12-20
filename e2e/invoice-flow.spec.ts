import { test, expect } from '@playwright/test';

// Credentials for a user with MANAGER or ADMIN role
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'password',
};

test.describe('Invoice Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Listen to browser console logs
    page.on('console', msg => console.log(`[Browser Console] ${msg.text()}`));

    // Login before each test
    await page.goto('/signin');
    await page.getByLabel('Email').fill(TEST_USER.email);
    await page.getByLabel('Password').fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click({ force: true });
    
    // Wait for redirect to dashboard or home
    await expect(page).not.toHaveURL('/signin');
    console.log('Login passed, current URL:', page.url());
  });

  test('Full invoice lifecycle: Create -> Edit -> Send -> Pay', async ({ page }) => {
    // 1. Navigate to Invoices
    await page.goto('/finances/invoices');
    console.log('Navigated to invoices, current URL:', page.url());
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible();

    // 2. Create new invoice (Draft)
    await page.getByRole('button', { name: /new invoice/i }).click();
    await expect(page).toHaveURL(/\/finances\/invoices\/new/);
    
    // Fill form
    // Assuming there's a customer selector
    await page.getByRole('combobox', { name: /customer/i }).click();
    await page.getByRole('option').first().click(); // Select first available customer
    
    await page.locator('[name="items.0.description"]').fill('Web Development Services');
    await page.locator('[name="items.0.quantity"]').fill('10');
    await page.locator('[name="items.0.unitPrice"]').fill('150');
    
    await page.getByRole('button', { name: /create invoice/i }).click();
    
    // Expect redirect to invoice details
    await expect(page).toHaveURL(/\/finances\/invoices\/[a-zA-Z0-9]+/);
    const invoiceUrl = page.url();
    
    // Verify Draft status
    await expect(page.getByText('DRAFT', { exact: true })).toBeVisible();

    // 3. Edit Invoice
    await page.getByRole('button', { name: /edit/i }).click();
    await page.locator('[name="items.0.quantity"]').fill('12'); // Change quantity
    await page.getByRole('button', { name: /save/i }).click();
    
    // Verify update
    await expect(page.getByText('$1,800.00')).toBeVisible(); // 12 * 150

    // 4. Mark as Pending (Simulate Sending)
    await page.getByRole('button', { name: /mark as pending/i }).click();
    // Confirm modal if exists
    // await page.getByRole('button', { name: /confirm/i }).click();
    
    await expect(page.getByText('PENDING', { exact: true })).toBeVisible();

    // 5. Record Payment
    await page.getByRole('button', { name: /record payment/i }).click();
    await page.getByLabel(/amount/i).fill('1800');
    await page.getByLabel(/payment method/i).fill('Bank Transfer');
    await page.getByRole('button', { name: /save/i }).click();

    // 6. Verify Paid Status
    await expect(page.getByText('PAID', { exact: true })).toBeVisible();
    
    // Verify receipt availability (dependent on implementation)
    // await expect(page.getByRole('button', { name: /download receipt/i })).toBeVisible();
  });
});
