# Invoice Repository Standardisation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the invoice feature into line with the repo-scoped naming convention, fix TS errors, add a missing Zod schema, fix a factory bug, and add an integration test.

**Architecture:** No behavioural changes — purely rename, fix, and test. All changes propagate from `InvoiceRepository` outward to actions, preview-email, tests, and factory.

**Tech Stack:** TypeScript, Prisma, Zod, Vitest, Testcontainers (integration tests via `setupTestDatabaseLifecycle`).

---

## File Map

| File                                                           | Action                              |
| -------------------------------------------------------------- | ----------------------------------- |
| `src/repositories/invoice-repository.ts`                       | Rename 14 methods, fix 2 TS bugs    |
| `src/actions/finances/invoices/mutations.ts`                   | Update all repo method calls        |
| `src/actions/finances/invoices/queries.ts`                     | Update all repo method calls        |
| `src/actions/finances/invoices/preview-email.ts`               | Update `findByIdMetadata` call      |
| `src/schemas/invoices.ts`                                      | Add `BulkUpdateInvoiceStatusSchema` |
| `src/lib/testing/factories/invoice.factory.ts`                 | Remove stale `cancelledDate` field  |
| `src/actions/finances/invoices/__tests__/mutations.test.ts`    | Update mock method names            |
| `src/actions/finances/invoices/__tests__/queries.test.ts`      | Update mock method names            |
| `src/repositories/__tests__/invoice-repository.integration.ts` | Create new file                     |

---

## Rename Reference

| Current name             | New name                        |
| ------------------------ | ------------------------------- |
| `searchAndPaginate`      | `searchInvoices`                |
| `findByIdWithDetails`    | `findInvoiceByIdWithDetails`    |
| `findByIdMetadata`       | `findInvoiceMetadataById`       |
| `markAsPending`          | `markInvoiceAsPending`          |
| `markAsDraft`            | `markInvoiceAsDraft`            |
| `addPayment`             | `addInvoicePayment`             |
| `duplicate`              | `duplicateInvoice`              |
| `bulkUpdateStatus`       | `bulkUpdateInvoiceStatus`       |
| `generateReceiptNumber`  | `generateInvoiceReceiptNumber`  |
| `updateReceiptNumber`    | `updateInvoiceReceiptNumber`    |
| `incrementReminderCount` | `incrementInvoiceReminderCount` |
| `getStatistics`          | `getInvoiceStatistics`          |
| `getMonthlyRevenueTrend` | `getInvoiceMonthlyRevenueTrend` |
| `getTopDebtors`          | `getInvoiceTopDebtors`          |

Already scoped (no change): `cancelInvoice`, `deleteInvoice`, `generateInvoiceNumber`, `createInvoiceWithItems`, `updateInvoiceWithItems`, `findInvoiceItems`, `findInvoicePayments`, `findInvoiceStatusHistory`, `incrementReminderCount`.

---

## Task 1: Rename repository methods + fix TS bugs

**Files:**

- Modify: `src/repositories/invoice-repository.ts`

### What to rename (public method signatures)

Rename each method definition. Keep signatures identical except for the method name.

### TS bugs to fix while touching the file

**Bug 1** — `duplicateInvoice` calls `this.generateInvoiceNumber()` without `tenantId`, and does not include `tenantId` in the `invoice.create` data block.

Fix: the original invoice is fetched with `findUnique` using `include`, so `original.tenantId` is available. Pass it:

```ts
const invoiceNumber = await this.generateInvoiceNumber(original.tenantId);
// and in the create data:
tenantId: original.tenantId,
```

**Bug 2** — `addInvoicePayment` calls `this.findByIdWithDetails(invoiceId)` (line ~1368) without `tenantId`. After rename this becomes `this.findInvoiceByIdWithDetails(invoiceId)` — still missing tenantId.

Fix: add `tenantId: true` to the initial invoice `select` block inside `addInvoicePayment`, then use `invoice.tenantId` in the re-fetch call:

```ts
const updated = await this.findInvoiceByIdWithDetails(invoiceId, invoice.tenantId);
```

### Internal `this.xxx` calls to update

| Location                        | Old call                                      | New call                                                                                                                                                                                                          |
| ------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getInvoiceStatistics`          | `this.getMonthlyRevenueTrend(12, tenantId)`   | `this.getInvoiceMonthlyRevenueTrend(12, tenantId)`                                                                                                                                                                |
| `getInvoiceStatistics`          | `this.getTopDebtors(5, tenantId)`             | `this.getInvoiceTopDebtors(5, tenantId)`                                                                                                                                                                          |
| `markInvoiceAsPending`          | `this.findByIdWithDetails(updated.id)`        | `this.findInvoiceByIdWithDetails(updated.id, tenantId)` — note: tenantId comes from the initial findUnique; add `tenantId: true` to that select                                                                   |
| `markInvoiceAsDraft`            | `this.findByIdWithDetails(updated.id)`        | `this.findInvoiceByIdWithDetails(updated.id, tenantId)` — same as above                                                                                                                                           |
| `cancelInvoice`                 | `this.findByIdWithDetails(updated.id)`        | `this.findInvoiceByIdWithDetails(updated.id, tenantId)` — same pattern                                                                                                                                            |
| `updateInvoiceWithItems`        | `this.findByIdWithDetails(updatedInvoice.id)` | `this.findInvoiceByIdWithDetails(updatedInvoice.id, data.tenantId ?? tenantId)` — `updateInvoiceWithItems` does not take tenantId; add `tenantId` param or use a separate select to get it before the transaction |
| `addInvoicePayment`             | `this.findByIdWithDetails(invoiceId)`         | `this.findInvoiceByIdWithDetails(invoiceId, invoice.tenantId)`                                                                                                                                                    |
| `addInvoicePayment`             | `this.generateReceiptNumber()`                | `this.generateInvoiceReceiptNumber()`                                                                                                                                                                             |
| `incrementInvoiceReminderCount` | `this.findById(id)`                           | keep as-is (inherited base method)                                                                                                                                                                                |

> Note for `updateInvoiceWithItems`: the cleanest fix is to add `tenantId: string` as a parameter. Check callers — only `mutations.ts:updateInvoice` calls it. Pass `ctx.tenantId` there.

- [ ] **Step 1: Rename all 14 public method definitions** using replace-all in the file. Do them one at a time to avoid mistakes.

- [ ] **Step 2: Update all internal `this.xxx` calls** per the table above.

- [ ] **Step 3: Fix Bug 1** (duplicateInvoice missing tenantId) — add `tenantId: true` to the select on the initial findUnique and pass it to `generateInvoiceNumber` and the create call.

- [ ] **Step 4: Fix Bug 2** (addInvoicePayment re-fetch missing tenantId) — add `tenantId: true` to the initial invoice select, pass it to the re-fetch call.

- [ ] **Step 5: Fix updateInvoiceWithItems** — add `tenantId: string` parameter, update internal re-fetch call.

- [ ] **Step 6: Run type check**

```bash
pnpm tsc --noEmit 2>&1 | head -60
```

Expected: errors only in callers (not yet updated). Fix any unexpected errors in this file.

---

## Task 2: Update actions — mutations.ts

**Files:**

- Modify: `src/actions/finances/invoices/mutations.ts`

- [ ] **Step 1: Update all invoiceRepo method calls** using the rename table. Full list of changes in this file:

```ts
// updateInvoice — remove redundant pre-check (updateInvoiceWithItems throws if not found)
// DELETE: const existing = await invoiceRepo.findById(validatedData.id);
//         if (!existing) { return { success: false, error: 'Invoice not found' }; }
// ADD: pass ctx.tenantId as third arg to updateInvoiceWithItems (after adding the param in Task 1 Step 5)

invoiceRepo.updateInvoiceWithItems(validatedData.id, validatedData)
// becomes:
invoiceRepo.updateInvoiceWithItems(validatedData.id, validatedData, ctx.tenantId)

invoiceRepo.markAsPending → invoiceRepo.markInvoiceAsPending
invoiceRepo.markAsDraft   → invoiceRepo.markInvoiceAsDraft
invoiceRepo.addPayment    → invoiceRepo.addInvoicePayment
invoiceRepo.duplicate     → invoiceRepo.duplicateInvoice
invoiceRepo.bulkUpdateStatus → invoiceRepo.bulkUpdateInvoiceStatus
invoiceRepo.findByIdWithDetails → invoiceRepo.findInvoiceByIdWithDetails
invoiceRepo.generateReceiptNumber → invoiceRepo.generateInvoiceReceiptNumber
invoiceRepo.updateReceiptNumber   → invoiceRepo.updateInvoiceReceiptNumber
invoiceRepo.incrementReminderCount → invoiceRepo.incrementInvoiceReminderCount
```

- [ ] **Step 2: Add Zod validation for bulkUpdateInvoiceStatus input**

Import `BulkUpdateInvoiceStatusSchema` (added in Task 4) and add `const validatedData = BulkUpdateInvoiceStatusSchema.parse(data);` at the top of the `bulkUpdateInvoiceStatus` handler. Use `validatedData.ids` and `validatedData.status` from there.

- [ ] **Step 3: Run type check**

```bash
pnpm tsc --noEmit 2>&1 | head -60
```

Expected: mutations.ts errors resolved, queries/preview still pending.

---

## Task 3: Update actions — queries.ts and preview-email.ts

**Files:**

- Modify: `src/actions/finances/invoices/queries.ts`
- Modify: `src/actions/finances/invoices/preview-email.ts`

- [ ] **Step 1: Update queries.ts**

```ts
invoiceRepo.searchAndPaginate    → invoiceRepo.searchInvoices
invoiceRepo.findByIdWithDetails  → invoiceRepo.findInvoiceByIdWithDetails
invoiceRepo.findByIdMetadata     → invoiceRepo.findInvoiceMetadataById
invoiceRepo.getStatistics        → invoiceRepo.getInvoiceStatistics
invoiceRepo.getMonthlyRevenueTrend → invoiceRepo.getInvoiceMonthlyRevenueTrend
invoiceRepo.getTopDebtors        → invoiceRepo.getInvoiceTopDebtors
```

- [ ] **Step 2: Update preview-email.ts**

```ts
invoiceRepository.findByIdMetadata → invoiceRepository.findInvoiceMetadataById
```

- [ ] **Step 3: Run full type check**

```bash
pnpm tsc --noEmit 2>&1 | head -60
```

Expected: all errors from Tasks 1–3 resolved.

---

## Task 4: Add missing Zod schema

**Files:**

- Modify: `src/schemas/invoices.ts`

- [ ] **Step 1: Add `BulkUpdateInvoiceStatusSchema` after `CancelInvoiceSchema`**

```ts
/**
 * Bulk Update Invoice Status Schema
 */
export const BulkUpdateInvoiceStatusSchema = z.object({
  ids: z
    .array(z.cuid({ error: 'Invalid invoice ID' }))
    .min(1, { error: 'At least one invoice ID is required' }),
  status: InvoiceStatusSchema,
});

export type BulkUpdateInvoiceStatusInput = z.infer<typeof BulkUpdateInvoiceStatusSchema>;
```

- [ ] **Step 2: Import it in mutations.ts**

Add to the import block in `mutations.ts`:

```ts
import {
  ...
  BulkUpdateInvoiceStatusSchema,
  type BulkUpdateInvoiceStatusInput,
} from '@/schemas/invoices';
```

Update `bulkUpdateInvoiceStatus` action signature to use `BulkUpdateInvoiceStatusInput`.

---

## Task 5: Fix factory bug

**Files:**

- Modify: `src/lib/testing/factories/invoice.factory.ts`

- [ ] **Step 1: Remove `cancelledDate` from `createCancelInvoiceInput`**

`CancelInvoiceInput` only has `{ id, cancelReason }`. The `cancelledDate` field is not in the schema. Remove it:

```ts
export function createCancelInvoiceInput(
  overrides: Partial<CancelInvoiceInput> = {},
): CancelInvoiceInput {
  return {
    id: overrides.id ?? testIds.invoice(),
    cancelReason: 'Customer request',
    ...overrides,
  };
}
```

---

## Task 6: Update unit test mocks

**Files:**

- Modify: `src/actions/finances/invoices/__tests__/mutations.test.ts`
- Modify: `src/actions/finances/invoices/__tests__/queries.test.ts`

- [ ] **Step 1: Update `mockInvoiceRepo` in mutations.test.ts**

```ts
// Rename mock keys to match new method names:
markAsPending        → markInvoiceAsPending
markAsDraft          → markInvoiceAsDraft
addPayment           → addInvoicePayment
cancelInvoice        → cancelInvoice  // already scoped, no change
deleteInvoice        → deleteInvoice  // already scoped, no change
duplicate            → duplicateInvoice
bulkUpdateStatus     → bulkUpdateInvoiceStatus
findByIdWithDetails  → findInvoiceByIdWithDetails
generateReceiptNumber → generateInvoiceReceiptNumber
updateReceiptNumber  → updateInvoiceReceiptNumber   // add if used
incrementReminderCount → incrementInvoiceReminderCount
```

Update all `mockInvoiceRepo.xxx.mockResolvedValue` call sites accordingly.

- [ ] **Step 2: Update `mockRepoInstance` in queries.test.ts**

```ts
searchAndPaginate    → searchInvoices
findByIdWithDetails  → findInvoiceByIdWithDetails
findByIdMetadata     → findInvoiceMetadataById
getStatistics        → getInvoiceStatistics
getMonthlyRevenueTrend → getInvoiceMonthlyRevenueTrend
getTopDebtors        → getInvoiceTopDebtors
```

- [ ] **Step 3: Fix broken assertion in queries.test.ts**

The test `'returns statistics with date filter'` asserts:

```ts
expect(mockRepoInstance.getStatistics).toHaveBeenCalledWith(dateFilter);
```

After rename it must be `getInvoiceStatistics`. Also the action passes `(ctx.tenantId, dateFilter)` so the assertion should be:

```ts
expect(mockRepoInstance.getInvoiceStatistics).toHaveBeenCalledWith(
  mockSession.user.tenantId,
  dateFilter,
);
```

- [ ] **Step 4: Run unit tests**

```bash
pnpm vitest run src/actions/finances/invoices/__tests__
```

Expected: all pass.

---

## Task 7: Create integration test

**Files:**

- Create: `src/repositories/__tests__/invoice-repository.integration.ts`

- [ ] **Step 1: Create the file**

```ts
/**
 * InvoiceRepository Integration Tests
 *
 * Tests the repository against a real Postgres database spun up via
 * Testcontainers. No mocks — every assertion hits an actual DB query.
 *
 * Run with: pnpm test:integration
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { InvoiceRepository } from '../invoice-repository';
import { CustomerRepository } from '../customer-repository';
import {
  setupTestDatabaseLifecycle,
  getTestPrisma,
  createTestTenant,
} from '@/lib/testing/integration/database';
import { createInvoiceInput, createCustomerInput } from '@/lib/testing';

vi.mock('@/lib/prisma', () => ({ prisma: {} }));

setupTestDatabaseLifecycle();

describe('InvoiceRepository (integration)', () => {
  let repository: InvoiceRepository;
  let customerRepo: CustomerRepository;
  let tenantId: string;
  let customerId: string;

  beforeAll(() => {
    repository = new InvoiceRepository(getTestPrisma());
    customerRepo = new CustomerRepository(getTestPrisma());
  });

  beforeEach(async () => {
    ({ id: tenantId } = await createTestTenant({ name: 'Invoice Test Tenant' }));
    const customer = await customerRepo.createCustomer(createCustomerInput(), tenantId);
    customerId = customer.id;
  });

  // -- createInvoiceWithItems ------------------------------------------------

  describe('createInvoiceWithItems', () => {
    it('creates an invoice and returns id and invoiceNumber', async () => {
      const result = await repository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );

      expect(result.id).toBeDefined();
      expect(result.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/);
    });

    it('generates sequential invoice numbers within same tenant', async () => {
      const first = await repository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );
      const second = await repository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );

      const firstNum = parseInt(first.invoiceNumber.split('-')[2], 10);
      const secondNum = parseInt(second.invoiceNumber.split('-')[2], 10);
      expect(secondNum).toBe(firstNum + 1);
    });
  });

  // -- findInvoiceByIdWithDetails --------------------------------------------

  describe('findInvoiceByIdWithDetails', () => {
    it('returns full invoice details including customer and items', async () => {
      const { id } = await repository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );

      const result = await repository.findInvoiceByIdWithDetails(id, tenantId);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(id);
      expect(result!.customer.id).toBe(customerId);
      expect(Array.isArray(result!.items)).toBe(true);
      expect(result!.items.length).toBeGreaterThan(0);
    });

    it('returns null for a non-existent ID', async () => {
      const result = await repository.findInvoiceByIdWithDetails(
        'cltest000000000000none0001',
        tenantId,
      );

      expect(result).toBeNull();
    });

    it('returns null when invoice belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Isolation Tenant' });
      const otherCustomer = await customerRepo.createCustomer(createCustomerInput(), otherTenantId);
      const { id } = await repository.createInvoiceWithItems(
        createInvoiceInput({ customerId: otherCustomer.id }),
        otherTenantId,
      );

      const result = await repository.findInvoiceByIdWithDetails(id, tenantId);

      expect(result).toBeNull();
    });

    it('converts Decimal fields to number', async () => {
      const { id } = await repository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );

      const result = await repository.findInvoiceByIdWithDetails(id, tenantId);

      expect(typeof result!.amount).toBe('number');
      expect(typeof result!.amountPaid).toBe('number');
      expect(typeof result!.amountDue).toBe('number');
    });
  });

  // -- findInvoiceMetadataById -----------------------------------------------

  describe('findInvoiceMetadataById', () => {
    it('returns lightweight metadata without items or payments arrays', async () => {
      const { id } = await repository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );

      const result = await repository.findInvoiceMetadataById(id, tenantId);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(id);
      expect(result!._count).toBeDefined();
    });

    it('returns null for a non-existent ID', async () => {
      const result = await repository.findInvoiceMetadataById(
        'cltest000000000000none0001',
        tenantId,
      );

      expect(result).toBeNull();
    });
  });

  // -- searchInvoices --------------------------------------------------------

  describe('searchInvoices', () => {
    it('returns only invoices scoped to the tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Search Isolation Tenant' });
      const otherCustomer = await customerRepo.createCustomer(createCustomerInput(), otherTenantId);

      await repository.createInvoiceWithItems(createInvoiceInput({ customerId }), tenantId);
      await repository.createInvoiceWithItems(
        createInvoiceInput({ customerId: otherCustomer.id }),
        otherTenantId,
      );

      const result = await repository.searchInvoices({ page: 1, perPage: 20 }, tenantId);

      expect(result.pagination.totalItems).toBe(1);
    });

    it('paginates correctly', async () => {
      await Promise.all([
        repository.createInvoiceWithItems(createInvoiceInput({ customerId }), tenantId),
        repository.createInvoiceWithItems(createInvoiceInput({ customerId }), tenantId),
        repository.createInvoiceWithItems(createInvoiceInput({ customerId }), tenantId),
      ]);

      const result = await repository.searchInvoices({ page: 1, perPage: 2 }, tenantId);

      expect(result.items).toHaveLength(2);
      expect(result.pagination.totalItems).toBe(3);
      expect(result.pagination.totalPages).toBe(2);
    });
  });

  // -- markInvoiceAsPending --------------------------------------------------

  describe('markInvoiceAsPending', () => {
    it('transitions invoice from DRAFT to PENDING', async () => {
      const { id } = await repository.createInvoiceWithItems(
        createInvoiceInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );

      const result = await repository.markInvoiceAsPending(id);

      expect(result!.status).toBe('PENDING');
    });

    it('returns null for a non-existent ID', async () => {
      const result = await repository.markInvoiceAsPending('cltest000000000000none0001');

      expect(result).toBeNull();
    });
  });

  // -- markInvoiceAsDraft ----------------------------------------------------

  describe('markInvoiceAsDraft', () => {
    it('transitions invoice from PENDING to DRAFT', async () => {
      const { id } = await repository.createInvoiceWithItems(
        createInvoiceInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      await repository.markInvoiceAsPending(id);

      const result = await repository.markInvoiceAsDraft(id);

      expect(result!.status).toBe('DRAFT');
    });
  });

  // -- cancelInvoice ---------------------------------------------------------

  describe('cancelInvoice', () => {
    it('cancels a PENDING invoice with a reason', async () => {
      const { id } = await repository.createInvoiceWithItems(
        createInvoiceInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      await repository.markInvoiceAsPending(id);

      const result = await repository.cancelInvoice(id, 'Test cancellation');

      expect(result!.status).toBe('CANCELLED');
    });

    it('returns null for a non-existent ID', async () => {
      const result = await repository.cancelInvoice('cltest000000000000none0001', 'reason');

      expect(result).toBeNull();
    });
  });

  // -- deleteInvoice ---------------------------------------------------------

  describe('deleteInvoice', () => {
    it('soft-deletes a DRAFT invoice and returns true', async () => {
      const { id } = await repository.createInvoiceWithItems(
        createInvoiceInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );

      const deleted = await repository.deleteInvoice(id);

      expect(deleted).toBe(true);
      const found = await repository.findInvoiceByIdWithDetails(id, tenantId);
      expect(found).toBeNull();
    });

    it('throws when invoice is not in DRAFT status', async () => {
      const { id } = await repository.createInvoiceWithItems(
        createInvoiceInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      await repository.markInvoiceAsPending(id);

      await expect(repository.deleteInvoice(id)).rejects.toThrow(
        'Only DRAFT invoices can be deleted',
      );
    });

    it('throws when invoice does not exist', async () => {
      await expect(repository.deleteInvoice('cltest000000000000none0001')).rejects.toThrow(
        'Invoice not found',
      );
    });
  });

  // -- duplicateInvoice ------------------------------------------------------

  describe('duplicateInvoice', () => {
    it('creates a new DRAFT invoice with a new invoice number', async () => {
      const { id, invoiceNumber } = await repository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );

      const duplicate = await repository.duplicateInvoice(id);

      expect(duplicate.id).not.toBe(id);
      expect(duplicate.invoiceNumber).not.toBe(invoiceNumber);
    });

    it('throws when source invoice does not exist', async () => {
      await expect(repository.duplicateInvoice('cltest000000000000none0001')).rejects.toThrow(
        'Invoice not found',
      );
    });
  });
});
```

- [ ] **Step 2: Run integration tests**

```bash
pnpm test:integration src/repositories/__tests__/invoice-repository.integration.ts
```

Expected: all pass.

---

## Task 8: Final verification

- [ ] **Step 1: Full type check**

```bash
pnpm tsc --noEmit 2>&1 | grep -i invoice
```

Expected: no errors referencing invoice files.

- [ ] **Step 2: Run all invoice unit tests**

```bash
pnpm vitest run src/actions/finances/invoices
```

Expected: all pass.

- [ ] **Step 3: Run full unit test suite**

```bash
pnpm vitest run
```

Expected: no regressions.

---

## Self-Review

**Spec coverage check:**

- ✓ Rename methods to repo-scoped names — Tasks 1–3
- ✓ No barrel file — already absent, no action needed
- ✓ Factory exists and is exported — fixed bug in Task 5
- ✓ Integration test — Task 7
- ✓ Action tests updated — Task 6
- ✓ Missing Zod schema — Task 4 adds `BulkUpdateInvoiceStatusSchema`
- ✓ TS errors — Tasks 1–3 + Bug 1 + Bug 2 + Task 8

**Placeholder scan:** None found — all steps include exact code or exact commands.

**Type consistency:** `BulkUpdateInvoiceStatusInput` defined in Task 4, consumed in Task 2. `updateInvoiceWithItems` gets `tenantId` param in Task 1 Step 5, callers updated in Task 2.
