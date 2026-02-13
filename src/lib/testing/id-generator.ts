/**
 * Test ID Generator
 *
 * Generates valid CUID-format IDs for testing purposes.
 * These IDs have a consistent format that passes validation while being
 * easily identifiable as test data.
 */

// Base CUID prefix that satisfies the CUID format requirements
const CUID_BASE = 'cjld2cjxh0000qzrmn83';

// Counter for generating unique IDs within a test run
let idCounter = 0;

/**
 * Resets the ID counter. Call this in beforeEach if you need deterministic IDs.
 */
export function resetIdCounter(): void {
  idCounter = 0;
}

/**
 * Generates a unique test ID with an optional prefix for easier identification.
 *
 * @param prefix - Optional 4-character prefix to identify the entity type
 * @returns A valid CUID-format string
 *
 * @example
 * generateTestId('cust') // 'cjld2cjxh0000qzrmn83cust0001'
 * generateTestId('quot') // 'cjld2cjxh0000qzrmn83quot0002'
 */
export function generateTestId(prefix = 'test'): string {
  const paddedCounter = String(idCounter++).padStart(4, '0');
  const normalizedPrefix = prefix.slice(0, 4).padEnd(4, '0');
  return `${CUID_BASE}${normalizedPrefix}${paddedCounter}`;
}

/**
 * Pre-defined test ID generators for common entity types.
 * These ensure consistency across test files.
 */
export const testIds = {
  customer: () => generateTestId('cust'),
  quote: () => generateTestId('quot'),
  quoteItem: () => generateTestId('item'),
  quoteVersion: () => generateTestId('vers'),
  invoice: () => generateTestId('invc'),
  invoiceItem: () => generateTestId('iitm'),
  attachment: () => generateTestId('atch'),
  user: () => generateTestId('user'),
  session: () => generateTestId('sess'),
  product: () => generateTestId('prod'),
  organization: () => generateTestId('orgn'),
  employee: () => generateTestId('empl'),
  transaction: () => generateTestId('txn0'),
  category: () => generateTestId('catg'),
  nonExistent: () => generateTestId('none'),
} as const;

/**
 * Creates a set of test IDs that can be reused within a test suite.
 * Useful when you need to reference the same ID across multiple tests.
 *
 * @example
 * const ids = createTestIdSet();
 * // ids.customerId, ids.quoteId, etc. are all unique and consistent
 */
export function createTestIdSet() {
  return {
    customerId: testIds.customer(),
    quoteId: testIds.quote(),
    quoteItemId: testIds.quoteItem(),
    quoteVersionId: testIds.quoteVersion(),
    invoiceId: testIds.invoice(),
    invoiceItemId: testIds.invoiceItem(),
    attachmentId: testIds.attachment(),
    userId: testIds.user(),
    sessionId: testIds.session(),
    productId: testIds.product(),
    organizationId: testIds.organization(),
    employeeId: testIds.employee(),
    transactionId: testIds.transaction(),
    categoryId: testIds.category(),
    nonExistentId: testIds.nonExistent(),
  };
}
