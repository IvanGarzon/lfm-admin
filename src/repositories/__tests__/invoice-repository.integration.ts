/**
 * InvoiceRepository Integration Tests
 *
 * Tests the invoiceRepository against a real Postgres database spun up via
 * Testcontainers. No mocks — every assertion hits an actual DB query.
 *
 * Run with: pnpm test:integration
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { InvoiceStatus } from '@/prisma/client';
import { InvoiceRepository } from '@/repositories/invoice-repository';
import { CustomerRepository } from '@/repositories/customer-repository';
import {
  setupTestDatabaseLifecycle,
  getTestPrisma,
  createTestTenant,
} from '@/lib/testing/integration/database';
import { createInvoiceInput, createCustomerInput } from '@/lib/testing';

// Prevent the module-level singleton from running before the container is ready.
vi.mock('@/lib/prisma', () => ({ prisma: {} }));

// The PDF service's import chain pulls in next-auth → audit.service which
// cannot resolve in the Vitest environment. Mock the entire PDF service so
// its transitive dependencies are never resolved.
vi.mock('@/features/finances/invoices/services/invoice-pdf.service', () => ({
  getOrGenerateInvoicePdf: vi
    .fn()
    .mockResolvedValue({ pdfBuffer: null, s3Key: '', s3Url: '', signedUrl: '' }),
  getOrGenerateReceiptPdf: vi
    .fn()
    .mockResolvedValue({ pdfBuffer: null, s3Key: '', s3Url: '', signedUrl: '' }),
}));

setupTestDatabaseLifecycle();

describe('InvoiceRepository (integration)', () => {
  let invoiceRepository: InvoiceRepository;
  let customerRepository: CustomerRepository;
  let tenantId: string;
  let customerId: string;

  beforeAll(() => {
    invoiceRepository = new InvoiceRepository(getTestPrisma());
    customerRepository = new CustomerRepository(getTestPrisma());
  });

  beforeEach(async () => {
    ({ id: tenantId } = await createTestTenant({ name: 'Invoice Test Tenant' }));
    const customer = await customerRepository.createCustomer(createCustomerInput(), tenantId);
    customerId = customer.id;
  });

  describe('createInvoiceWithItems', () => {
    it('creates an invoice and returns id and invoiceNumber', async () => {
      const result = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );

      expect(result.id).toBeDefined();
      expect(result.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/);
    });

    it('generates sequential invoice numbers within the same tenant', async () => {
      const first = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );
      const second = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );

      const firstSeq = parseInt(first.invoiceNumber.split('-')[2], 10);
      const secondSeq = parseInt(second.invoiceNumber.split('-')[2], 10);

      expect(secondSeq).toBe(firstSeq + 1);
    });

    it('generates independent sequences per tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Invoice Tenant' });
      const otherCustomer = await customerRepository.createCustomer(
        createCustomerInput(),
        otherTenantId,
      );

      const main = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );
      await invoiceRepository.createInvoiceWithItems(createInvoiceInput({ customerId }), tenantId);
      const other = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId: otherCustomer.id }),
        otherTenantId,
      );

      const mainSeq = parseInt(main.invoiceNumber.split('-')[2], 10);
      const otherSeq = parseInt(other.invoiceNumber.split('-')[2], 10);

      expect(otherSeq).toBe(mainSeq);
    });
  });

  describe('findInvoiceByIdWithDetails', () => {
    it('returns full invoice details', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );

      const result = await invoiceRepository.findInvoiceByIdWithDetails(id, tenantId);

      expect(result).not.toBeNull();
      if (!result) throw new Error('Expected result to not be null');
      expect(result.id).toBe(id);
      expect(result.customer.id).toBe(customerId);
      expect(Array.isArray(result.items)).toBe(true);
      expect(Array.isArray(result.payments)).toBe(true);
      expect(Array.isArray(result.statusHistory)).toBe(true);
    });

    it('converts Decimal fields to number', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );

      const result = await invoiceRepository.findInvoiceByIdWithDetails(id, tenantId);

      expect(result).not.toBeNull();
      if (!result) throw new Error('Expected result to not be null');
      expect(typeof result.amount).toBe('number');
      expect(typeof result.gst).toBe('number');
      expect(typeof result.discount).toBe('number');
      expect(typeof result.amountPaid).toBe('number');
      expect(typeof result.amountDue).toBe('number');
    });

    it('returns null for a non-existent ID', async () => {
      const result = await invoiceRepository.findInvoiceByIdWithDetails(
        'cltest000000000000none0001',
        tenantId,
      );

      expect(result).toBeNull();
    });

    it('returns null when ID belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Isolation Tenant A' });
      const otherCustomer = await customerRepository.createCustomer(
        createCustomerInput(),
        otherTenantId,
      );
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId: otherCustomer.id }),
        otherTenantId,
      );

      const result = await invoiceRepository.findInvoiceByIdWithDetails(id, tenantId);

      expect(result).toBeNull();
    });
  });

  describe('findInvoiceMetadataById', () => {
    it('returns lightweight metadata with _count', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );

      const result = await invoiceRepository.findInvoiceMetadataById(id, tenantId);

      expect(result).not.toBeNull();
      if (!result) throw new Error('Expected result to not be null');
      expect(result.id).toBe(id);

      if (!result._count) throw new Error('expected _count to be defined');
      expect(typeof result._count.items).toBe('number');
      expect(typeof result._count.payments).toBe('number');
      expect(typeof result._count.statusHistory).toBe('number');
    });

    it('returns null for a non-existent ID', async () => {
      const result = await invoiceRepository.findInvoiceMetadataById(
        'cltest000000000000none0001',
        tenantId,
      );

      expect(result).toBeNull();
    });

    it('returns null when ID belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Metadata Isolation Tenant' });
      const otherCustomer = await customerRepository.createCustomer(
        createCustomerInput(),
        otherTenantId,
      );
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId: otherCustomer.id }),
        otherTenantId,
      );

      const result = await invoiceRepository.findInvoiceMetadataById(id, tenantId);

      expect(result).toBeNull();
    });
  });

  describe('searchInvoices', () => {
    it('returns only invoices scoped to the tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Search Isolation Tenant' });
      const otherCustomer = await customerRepository.createCustomer(
        createCustomerInput(),
        otherTenantId,
      );

      await invoiceRepository.createInvoiceWithItems(createInvoiceInput({ customerId }), tenantId);
      await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId: otherCustomer.id }),
        otherTenantId,
      );

      const result = await invoiceRepository.searchInvoices({ page: 1, perPage: 20 }, tenantId);

      expect(result.pagination.totalItems).toBe(1);
    });

    it('paginates correctly', async () => {
      await invoiceRepository.createInvoiceWithItems(createInvoiceInput({ customerId }), tenantId);
      await invoiceRepository.createInvoiceWithItems(createInvoiceInput({ customerId }), tenantId);
      await invoiceRepository.createInvoiceWithItems(createInvoiceInput({ customerId }), tenantId);

      const result = await invoiceRepository.searchInvoices({ page: 1, perPage: 2 }, tenantId);

      expect(result.items).toHaveLength(2);
      expect(result.pagination.totalItems).toBe(3);
      expect(result.pagination.totalPages).toBe(2);
    });

    it('filters by status', async () => {
      await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      const { id: pendingId } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      await invoiceRepository.markInvoiceAsPending(pendingId, tenantId);

      const result = await invoiceRepository.searchInvoices(
        { status: ['PENDING'], page: 1, perPage: 20 },
        tenantId,
      );

      expect(result.pagination.totalItems).toBe(1);
      expect(result.items[0].status).toBe('PENDING');
    });

    it('filters by search term matching customer name', async () => {
      const matchingCustomer = await customerRepository.createCustomer(
        createCustomerInput({ firstName: 'Alice', lastName: 'Unique', email: 'alice@example.com' }),
        tenantId,
      );
      await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId: matchingCustomer.id }),
        tenantId,
      );
      await invoiceRepository.createInvoiceWithItems(createInvoiceInput({ customerId }), tenantId);

      const result = await invoiceRepository.searchInvoices(
        { search: 'Alice', page: 1, perPage: 20 },
        tenantId,
      );

      expect(result.pagination.totalItems).toBe(1);
      expect(result.items[0].customerId).toBe(matchingCustomer.id);
    });

    it('filters by search term matching invoice number', async () => {
      const { invoiceNumber } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );
      await invoiceRepository.createInvoiceWithItems(createInvoiceInput({ customerId }), tenantId);

      const result = await invoiceRepository.searchInvoices(
        { search: invoiceNumber, page: 1, perPage: 20 },
        tenantId,
      );

      expect(result.pagination.totalItems).toBe(1);
      expect(result.items[0].invoiceNumber).toBe(invoiceNumber);
    });
  });

  describe('markInvoiceAsPending', () => {
    it('transitions a DRAFT invoice to PENDING', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );

      const result = await invoiceRepository.markInvoiceAsPending(id, tenantId);

      expect(result).not.toBeNull();
      if (!result) throw new Error('Expected result to not be null');
      expect(result.status).toBe('PENDING');
    });

    it('returns null for a non-existent ID', async () => {
      const result = await invoiceRepository.markInvoiceAsPending(
        'cltest000000000000none0001',
        tenantId,
      );

      expect(result).toBeNull();
    });

    it('returns null when ID belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Pending Isolation Tenant' });
      const otherCustomer = await customerRepository.createCustomer(
        createCustomerInput(),
        otherTenantId,
      );
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId: otherCustomer.id }),
        otherTenantId,
      );

      const result = await invoiceRepository.markInvoiceAsPending(id, tenantId);

      expect(result).toBeNull();
    });

    it('throws when attempting an invalid transition (CANCELLED → PENDING)', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      await invoiceRepository.markInvoiceAsPending(id, tenantId);
      await invoiceRepository.cancelInvoice(id, tenantId, 'cancelled for test');

      await expect(invoiceRepository.markInvoiceAsPending(id, tenantId)).rejects.toThrow();
    });
  });

  describe('markInvoiceAsDraft', () => {
    it('transitions a PENDING invoice back to DRAFT', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      await invoiceRepository.markInvoiceAsPending(id, tenantId);

      const result = await invoiceRepository.markInvoiceAsDraft(id, tenantId);

      expect(result).not.toBeNull();
      if (!result) throw new Error('Expected result to not be null');
      expect(result.status).toBe('DRAFT');
    });

    it('returns null for a non-existent ID', async () => {
      const result = await invoiceRepository.markInvoiceAsDraft(
        'cltest000000000000none0001',
        tenantId,
      );

      expect(result).toBeNull();
    });

    it('returns null when ID belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Draft Isolation Tenant' });
      const otherCustomer = await customerRepository.createCustomer(
        createCustomerInput(),
        otherTenantId,
      );
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId: otherCustomer.id }),
        otherTenantId,
      );
      await invoiceRepository.markInvoiceAsPending(id, otherTenantId);

      const result = await invoiceRepository.markInvoiceAsDraft(id, tenantId);

      expect(result).toBeNull();
    });

    it('throws when attempting an invalid transition (PAID → DRAFT)', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );
      await invoiceRepository.markInvoiceAsPending(id, tenantId);
      await invoiceRepository.addInvoicePayment(id, tenantId, 110, 'Bank Transfer', new Date());

      await expect(invoiceRepository.markInvoiceAsDraft(id, tenantId)).rejects.toThrow();
    });
  });

  describe('cancelInvoice', () => {
    it('transitions a PENDING invoice to CANCELLED with a reason', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      await invoiceRepository.markInvoiceAsPending(id, tenantId);

      const result = await invoiceRepository.cancelInvoice(id, tenantId, 'Customer request');

      expect(result).not.toBeNull();
      if (!result) throw new Error('Expected result to not be null');
      expect(result.status).toBe('CANCELLED');
    });

    it('returns null for a non-existent ID', async () => {
      const result = await invoiceRepository.cancelInvoice(
        'cltest000000000000none0001',
        tenantId,
        'No reason',
      );

      expect(result).toBeNull();
    });

    it('returns null when ID belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Cancel Isolation Tenant' });
      const otherCustomer = await customerRepository.createCustomer(
        createCustomerInput(),
        otherTenantId,
      );
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId: otherCustomer.id }),
        otherTenantId,
      );
      await invoiceRepository.markInvoiceAsPending(id, otherTenantId);

      const result = await invoiceRepository.cancelInvoice(id, tenantId, 'Cross-tenant attempt');

      expect(result).toBeNull();
    });

    it('throws when trying to cancel a PAID invoice', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );
      await invoiceRepository.markInvoiceAsPending(id, tenantId);
      await invoiceRepository.addInvoicePayment(id, tenantId, 110, 'Bank Transfer', new Date());

      await expect(
        invoiceRepository.cancelInvoice(id, tenantId, 'Attempting to cancel paid invoice'),
      ).rejects.toThrow();
    });
  });

  describe('deleteInvoice', () => {
    it('soft-deletes a DRAFT invoice and hides it from subsequent finds', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );

      await invoiceRepository.deleteInvoice(id, tenantId);

      const found = await invoiceRepository.findInvoiceByIdWithDetails(id, tenantId);
      expect(found).toBeNull();
    });

    it('throws when invoice is not in DRAFT status', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      await invoiceRepository.markInvoiceAsPending(id, tenantId);

      await expect(invoiceRepository.deleteInvoice(id, tenantId)).rejects.toThrow(
        'Only DRAFT invoices can be deleted',
      );
    });

    it('throws when invoice does not exist', async () => {
      await expect(
        invoiceRepository.deleteInvoice('cltest000000000000none0001', tenantId),
      ).rejects.toThrow('Invoice not found');
    });

    it('throws when ID belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Delete Isolation Tenant' });
      const otherCustomer = await customerRepository.createCustomer(
        createCustomerInput(),
        otherTenantId,
      );
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId: otherCustomer.id }),
        otherTenantId,
      );

      await expect(invoiceRepository.deleteInvoice(id, tenantId)).rejects.toThrow(
        'Invoice not found',
      );
    });
  });

  describe('duplicateInvoice', () => {
    it('creates a new DRAFT invoice with a different id and invoiceNumber', async () => {
      const { id: originalId, invoiceNumber: originalNumber } =
        await invoiceRepository.createInvoiceWithItems(
          createInvoiceInput({ customerId }),
          tenantId,
        );

      const duplicate = await invoiceRepository.duplicateInvoice(originalId, tenantId);

      expect(duplicate.id).not.toBe(originalId);
      expect(duplicate.invoiceNumber).not.toBe(originalNumber);
      expect(duplicate.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/);
    });

    it('duplicate starts in DRAFT status', async () => {
      const { id: originalId } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      await invoiceRepository.markInvoiceAsPending(originalId, tenantId);

      const duplicate = await invoiceRepository.duplicateInvoice(originalId, tenantId);
      const details = await invoiceRepository.findInvoiceByIdWithDetails(duplicate.id, tenantId);

      expect(details).not.toBeNull();
      if (!details) {
        throw new Error('Expected details to not be null');
      }

      expect(details.status).toBe('DRAFT');
    });

    it('throws when source invoice does not exist', async () => {
      await expect(
        invoiceRepository.duplicateInvoice('cltest000000000000none0001', tenantId),
      ).rejects.toThrow('Invoice not found');
    });

    it('throws when ID belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Duplicate Isolation Tenant' });
      const otherCustomer = await customerRepository.createCustomer(
        createCustomerInput(),
        otherTenantId,
      );
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId: otherCustomer.id }),
        otherTenantId,
      );

      await expect(invoiceRepository.duplicateInvoice(id, tenantId)).rejects.toThrow(
        'Invoice not found',
      );
    });

    it('copies all items from the original invoice', async () => {
      const { id: originalId } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({
          customerId,
          items: [
            { description: 'Item A', quantity: 2, unitPrice: 100, productId: null },
            { description: 'Item B', quantity: 1, unitPrice: 250, productId: null },
          ],
        }),
        tenantId,
      );

      const duplicate = await invoiceRepository.duplicateInvoice(originalId, tenantId);
      const items = await invoiceRepository.findInvoiceItems(duplicate.id);

      expect(items).toHaveLength(2);
      const descriptions = items.map((i) => i.description);
      expect(descriptions).toContain('Item A');
      expect(descriptions).toContain('Item B');
    });
  });

  // -- updateInvoiceWithItems --------------------------------------------------
  describe('updateInvoiceWithItems', () => {
    it('updates items and recalculates amount for a DRAFT invoice', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({
          customerId,
          items: [{ description: 'Old item', quantity: 1, unitPrice: 100, productId: null }],
        }),
        tenantId,
      );

      const updated = await invoiceRepository.updateInvoiceWithItems(
        id,
        {
          id,
          customerId,
          status: 'DRAFT',
          currency: 'AUD',
          gst: 10,
          discount: 0,
          issuedDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          items: [{ description: 'New item', quantity: 2, unitPrice: 200, productId: null }],
        },
        tenantId,
      );

      expect(updated).not.toBeNull();
      if (!updated) throw new Error('Expected result to not be null');
      expect(updated.items).toHaveLength(1);
      expect(updated.items[0].description).toBe('New item');
      // subtotal 400 + 10% GST = 440
      expect(updated.amount).toBe(440);
    });

    it('throws when trying to modify content of a locked (PENDING) invoice', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );
      await invoiceRepository.markInvoiceAsPending(id, tenantId);

      await expect(
        invoiceRepository.updateInvoiceWithItems(
          id,
          {
            id,
            customerId,
            status: 'PENDING',
            currency: 'AUD',
            gst: 10,
            discount: 0,
            issuedDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            items: [{ description: 'Changed item', quantity: 1, unitPrice: 999, productId: null }],
          },
          tenantId,
        ),
      ).rejects.toThrow(/pending/i);
    });

    it('throws when invoice not found', async () => {
      await expect(
        invoiceRepository.updateInvoiceWithItems(
          'cltest000000000000none0001',
          {
            id: 'cltest000000000000none0001',
            customerId,
            status: 'DRAFT',
            currency: 'AUD',
            gst: 10,
            discount: 0,
            issuedDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            items: [{ description: 'Item', quantity: 1, unitPrice: 100, productId: null }],
          },
          tenantId,
        ),
      ).rejects.toThrow('Invoice not found');
    });
  });

  describe('bulkUpdateInvoiceStatus', () => {
    it('updates all valid invoices to the target status', async () => {
      const { id: id1 } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      const { id: id2 } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );

      const results = await invoiceRepository.bulkUpdateInvoiceStatus(
        [id1, id2],
        tenantId,
        InvoiceStatus.PENDING,
      );

      expect(results).toHaveLength(2);
      expect(results.every((result) => result.success)).toBe(true);
    });

    it('skips invoices already at the target status', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      await invoiceRepository.markInvoiceAsPending(id, tenantId);

      const results = await invoiceRepository.bulkUpdateInvoiceStatus(
        [id],
        tenantId,
        InvoiceStatus.PENDING,
      );

      expect(results[0]).toEqual({ id, success: true });
    });

    it('returns failure for a non-existent ID', async () => {
      const results = await invoiceRepository.bulkUpdateInvoiceStatus(
        ['cltest000000000000none0001'],
        tenantId,
        InvoiceStatus.PENDING,
      );

      expect(results[0]).toEqual({
        id: 'cltest000000000000none0001',
        success: false,
        error: 'Invoice not found',
      });
    });

    it('returns failure for an ID belonging to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Bulk Isolation Tenant' });
      const otherCustomer = await customerRepository.createCustomer(
        createCustomerInput(),
        otherTenantId,
      );
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId: otherCustomer.id }),
        otherTenantId,
      );

      const results = await invoiceRepository.bulkUpdateInvoiceStatus(
        [id],
        tenantId,
        InvoiceStatus.PENDING,
      );

      expect(results[0]).toEqual({ id, success: false, error: 'Invoice not found' });
    });

    it('returns failure for an invalid status transition', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      await invoiceRepository.markInvoiceAsPending(id, tenantId);
      await invoiceRepository.cancelInvoice(id, tenantId, 'Test cancel');

      const results = await invoiceRepository.bulkUpdateInvoiceStatus(
        [id],
        tenantId,
        InvoiceStatus.PENDING,
      );

      expect(results[0].success).toBe(false);
      expect(results[0].error).toMatch(/terminal/i);
    });

    it('handles a mix of valid and invalid IDs in one call', async () => {
      const { id: validId } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );

      const results = await invoiceRepository.bulkUpdateInvoiceStatus(
        [validId, 'cltest000000000000none0001'],
        tenantId,
        InvoiceStatus.PENDING,
      );

      const valid = results.find((result) => result.id === validId);
      const missing = results.find((result) => result.id === 'cltest000000000000none0001');

      expect(valid?.success).toBe(true);
      expect(missing?.success).toBe(false);
    });
  });

  describe('addInvoicePayment', () => {
    it('records a partial payment and transitions invoice to PARTIALLY_PAID', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );
      await invoiceRepository.markInvoiceAsPending(id, tenantId);

      // Invoice amount = 110 (100 + 10% GST)
      const result = await invoiceRepository.addInvoicePayment(
        id,
        tenantId,
        50,
        'Credit Card',
        new Date(),
      );

      expect(result.status).toBe('PARTIALLY_PAID');
      expect(result.amountPaid).toBe(50);
      expect(result.amountDue).toBe(60);
      expect(result.payments).toHaveLength(1);
    });

    it('records a full payment and transitions invoice to PAID', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );
      await invoiceRepository.markInvoiceAsPending(id, tenantId);

      const result = await invoiceRepository.addInvoicePayment(
        id,
        tenantId,
        110,
        'Bank Transfer',
        new Date(),
      );

      expect(result.status).toBe('PAID');
      expect(result.amountPaid).toBe(110);
      expect(result.amountDue).toBe(0);
      expect(result.receiptNumber).toMatch(/^RCP-[A-F0-9]{8}$/);
    });

    it('throws when invoice is not found', async () => {
      await expect(
        invoiceRepository.addInvoicePayment(
          'cltest000000000000none0001',
          tenantId,
          50,
          'Credit Card',
          new Date(),
        ),
      ).rejects.toThrow('Invoice not found');
    });

    it('throws when invoice belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Payment Isolation Tenant' });
      const otherCustomer = await customerRepository.createCustomer(
        createCustomerInput(),
        otherTenantId,
      );
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId: otherCustomer.id }),
        otherTenantId,
      );
      await invoiceRepository.markInvoiceAsPending(id, otherTenantId);

      await expect(
        invoiceRepository.addInvoicePayment(id, tenantId, 50, 'Credit Card', new Date()),
      ).rejects.toThrow('Invoice not found');
    });

    it('does not double-record a payment when the same idempotency key is used twice', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );
      await invoiceRepository.markInvoiceAsPending(id, tenantId);

      const key = 'idem-test-key-001';
      await invoiceRepository.addInvoicePayment(
        id,
        tenantId,
        50,
        'Credit Card',
        new Date(),
        undefined,
        undefined,
        key,
      );
      await invoiceRepository.addInvoicePayment(
        id,
        tenantId,
        50,
        'Credit Card',
        new Date(),
        undefined,
        undefined,
        key,
      );

      const details = await invoiceRepository.findInvoiceByIdWithDetails(id, tenantId);
      expect(details?.payments).toHaveLength(1);
      expect(details?.amountPaid).toBe(50);
    });

    it('throws when trying to add a payment to a DRAFT invoice', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );

      await expect(
        invoiceRepository.addInvoicePayment(id, tenantId, 50, 'Credit Card', new Date()),
      ).rejects.toThrow();
    });

    it('records a second partial payment to a PARTIALLY_PAID invoice', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );
      await invoiceRepository.markInvoiceAsPending(id, tenantId);
      await invoiceRepository.addInvoicePayment(id, tenantId, 50, 'Credit Card', new Date());

      const result = await invoiceRepository.addInvoicePayment(
        id,
        tenantId,
        30,
        'Bank Transfer',
        new Date(),
      );

      // Invoice amount = 110; paid = 80; due = 30
      expect(result.status).toBe('PARTIALLY_PAID');
      expect(result.amountPaid).toBe(80);
      expect(result.amountDue).toBe(30);
      expect(result.payments).toHaveLength(2);
    });
  });

  describe('generateInvoiceNumber', () => {
    it('returns INV-YYYY-0001 when no invoices exist for the tenant', async () => {
      const year = new Date().getFullYear();

      const result = await invoiceRepository.generateInvoiceNumber(tenantId);

      expect(result).toBe(`INV-${year}-0001`);
    });

    it('returns the next sequential number when invoices already exist', async () => {
      const year = new Date().getFullYear();
      await invoiceRepository.createInvoiceWithItems(createInvoiceInput({ customerId }), tenantId);
      await invoiceRepository.createInvoiceWithItems(createInvoiceInput({ customerId }), tenantId);

      const result = await invoiceRepository.generateInvoiceNumber(tenantId);

      expect(result).toBe(`INV-${year}-0003`);
    });
  });

  describe('generateInvoiceReceiptNumber', () => {
    it('returns a string matching the RCP-XXXXXXXX format', async () => {
      const result = await invoiceRepository.generateInvoiceReceiptNumber();

      expect(result).toMatch(/^RCP-[A-F0-9]{8}$/);
    });

    it('returns a unique value on each call', async () => {
      const first = await invoiceRepository.generateInvoiceReceiptNumber();
      const second = await invoiceRepository.generateInvoiceReceiptNumber();

      expect(first).not.toBe(second);
    });
  });

  describe('updateInvoiceReceiptNumber', () => {
    it('updates the receipt number on an invoice', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );

      const result = await invoiceRepository.updateInvoiceReceiptNumber(
        id,
        tenantId,
        'RCP-TEST0001',
      );

      expect(result.receiptNumber).toBe('RCP-TEST0001');
    });

    it('throws when invoice does not exist', async () => {
      await expect(
        invoiceRepository.updateInvoiceReceiptNumber(
          'cltest000000000000none0001',
          tenantId,
          'RCP-TEST0001',
        ),
      ).rejects.toThrow();
    });

    it('throws when invoice belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Receipt Isolation Tenant' });
      const otherCustomer = await customerRepository.createCustomer(
        createCustomerInput(),
        otherTenantId,
      );
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId: otherCustomer.id }),
        otherTenantId,
      );

      await expect(
        invoiceRepository.updateInvoiceReceiptNumber(id, tenantId, 'RCP-TEST9999'),
      ).rejects.toThrow();
    });
  });

  describe('incrementInvoiceReminderCount', () => {
    it('increments remindersSent from 0 to 1', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );

      const result = await invoiceRepository.incrementInvoiceReminderCount(id, tenantId);

      expect(result).not.toBeNull();
      expect(result?.remindersSent).toBe(1);
    });

    it('increments on successive calls', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );
      await invoiceRepository.incrementInvoiceReminderCount(id, tenantId);

      const result = await invoiceRepository.incrementInvoiceReminderCount(id, tenantId);

      expect(result?.remindersSent).toBe(2);
    });

    it('returns null for a non-existent ID', async () => {
      const result = await invoiceRepository.incrementInvoiceReminderCount(
        'cltest000000000000none0001',
        tenantId,
      );

      expect(result).toBeNull();
    });

    it('returns null when ID belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Reminder Isolation Tenant' });
      const otherCustomer = await customerRepository.createCustomer(
        createCustomerInput(),
        otherTenantId,
      );
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId: otherCustomer.id }),
        otherTenantId,
      );

      const result = await invoiceRepository.incrementInvoiceReminderCount(id, tenantId);

      expect(result).toBeNull();
    });
  });

  describe('findInvoiceItems', () => {
    it('returns items for an invoice with Decimal fields converted to number', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );

      const items = await invoiceRepository.findInvoiceItems(id);

      expect(items).toHaveLength(1);
      expect(items[0].invoiceId).toBe(id);
      expect(typeof items[0].quantity).toBe('number');
      expect(typeof items[0].unitPrice).toBe('number');
      expect(typeof items[0].total).toBe('number');
      expect(items[0].quantity).toBe(1);
      expect(items[0].unitPrice).toBe(100);
      expect(items[0].total).toBe(100);
    });

    it('returns empty array for an invoice with no items', async () => {
      const items = await invoiceRepository.findInvoiceItems('cltest000000000000none0001');

      expect(items).toHaveLength(0);
    });
  });

  describe('findInvoicePayments', () => {
    it('returns empty array when invoice has no payments', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );

      const payments = await invoiceRepository.findInvoicePayments(id);

      expect(payments).toHaveLength(0);
    });

    it('returns payments after a payment is recorded', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );
      await invoiceRepository.markInvoiceAsPending(id, tenantId);
      await invoiceRepository.addInvoicePayment(id, tenantId, 50, 'Credit Card', new Date());

      const payments = await invoiceRepository.findInvoicePayments(id);

      expect(payments).toHaveLength(1);
      expect(typeof payments[0].amount).toBe('number');
      expect(payments[0].amount).toBe(50);
      expect(payments[0].method).toBe('Credit Card');
    });
  });

  describe('findInvoiceStatusHistory', () => {
    it('returns the initial status history entry after invoice creation', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );

      const history = await invoiceRepository.findInvoiceStatusHistory(id);

      expect(history).toHaveLength(1);
      expect(history[0].status).toBe('DRAFT');
      expect(history[0].previousStatus).toBeNull();
      expect(history[0].notes).toBe('Invoice created');
    });

    it('appends an entry on each status transition', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      await invoiceRepository.markInvoiceAsPending(id, tenantId);

      const history = await invoiceRepository.findInvoiceStatusHistory(id);

      expect(history).toHaveLength(2);
      expect(history[0].status).toBe('DRAFT');
      expect(history[1].status).toBe('PENDING');
      expect(history[1].previousStatus).toBe('DRAFT');
    });

    it('returns empty array for a non-existent invoice ID', async () => {
      const history = await invoiceRepository.findInvoiceStatusHistory(
        'cltest000000000000none0001',
      );

      expect(history).toHaveLength(0);
    });
  });

  describe('getInvoiceStatistics', () => {
    it('returns zeroed counts when no invoices exist', async () => {
      const result = await invoiceRepository.getInvoiceStatistics(tenantId);

      expect(result.total).toBe(0);
      expect(result.draft).toBe(0);
      expect(result.pending).toBe(0);
      expect(result.paid).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.pendingRevenue).toBe(0);
      expect(Array.isArray(result.revenueTrend)).toBe(true);
      expect(Array.isArray(result.topDebtors)).toBe(true);
    });

    it('counts DRAFT invoices correctly', async () => {
      await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );

      const result = await invoiceRepository.getInvoiceStatistics(tenantId);

      expect(result.total).toBe(2);
      expect(result.draft).toBe(2);
    });

    it('counts PENDING invoices and includes them in pendingRevenue', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );
      await invoiceRepository.markInvoiceAsPending(id, tenantId);

      const result = await invoiceRepository.getInvoiceStatistics(tenantId);

      expect(result.pending).toBe(1);
      expect(result.pendingRevenue).toBe(110);
    });

    it('counts PAID invoices and includes them in totalRevenue', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );
      await invoiceRepository.markInvoiceAsPending(id, tenantId);
      await invoiceRepository.addInvoicePayment(id, tenantId, 110, 'Bank Transfer', new Date());

      const result = await invoiceRepository.getInvoiceStatistics(tenantId);

      expect(result.paid).toBe(1);
      expect(result.totalRevenue).toBe(110);
      expect(result.avgInvoiceValue).toBe(110);
    });

    it('only counts invoices belonging to the tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Stats Isolation Tenant' });
      const otherCustomer = await customerRepository.createCustomer(
        createCustomerInput(),
        otherTenantId,
      );
      await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId: otherCustomer.id }),
        otherTenantId,
      );

      const result = await invoiceRepository.getInvoiceStatistics(tenantId);

      expect(result.total).toBe(0);
    });

    it('counts PARTIALLY_PAID invoices and includes amount in pendingRevenue', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );
      await invoiceRepository.markInvoiceAsPending(id, tenantId);
      await invoiceRepository.addInvoicePayment(id, tenantId, 50, 'Credit Card', new Date());

      const result = await invoiceRepository.getInvoiceStatistics(tenantId);

      expect(result.partiallyPaid).toBe(1);
      // pendingRevenue sums the full invoice amount, not amountDue
      expect(result.pendingRevenue).toBe(110);
    });

    it('filters statistics by date range', async () => {
      const past = new Date(2020, 0, 15);
      await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({
          customerId,
          issuedDate: past,
          dueDate: new Date(2020, 1, 15),
        }),
        tenantId,
      );
      await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId, issuedDate: new Date() }),
        tenantId,
      );

      const result = await invoiceRepository.getInvoiceStatistics(tenantId, {
        startDate: new Date(2021, 0, 1),
      });

      expect(result.total).toBe(1);
    });
  });

  describe('getInvoiceMonthlyRevenueTrend', () => {
    it('returns an empty array when no invoices exist', async () => {
      const result = await invoiceRepository.getInvoiceMonthlyRevenueTrend(12, tenantId);

      expect(result).toHaveLength(0);
    });

    it('returns monthly entries with correct shape and totals', async () => {
      await invoiceRepository.createInvoiceWithItems(createInvoiceInput({ customerId }), tenantId);

      const result = await invoiceRepository.getInvoiceMonthlyRevenueTrend(12, tenantId);

      // Invoice amount = 110 (100 + 10% GST), status is DRAFT so paid = 0
      expect(result.length).toBeGreaterThan(0);
      const entry = result[result.length - 1];
      expect(entry.month).toMatch(/^\w{3} \d{4}$/);
      expect(entry.total).toBe(110);
      expect(entry.paid).toBe(0);
    });

    it('only includes invoices belonging to the tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Trend Isolation Tenant' });
      const otherCustomer = await customerRepository.createCustomer(
        createCustomerInput(),
        otherTenantId,
      );
      await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId: otherCustomer.id }),
        otherTenantId,
      );

      const result = await invoiceRepository.getInvoiceMonthlyRevenueTrend(12, tenantId);

      expect(result).toHaveLength(0);
    });

    it('reflects paid amount in the paid field after a full payment', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId, issuedDate: new Date() }),
        tenantId,
      );
      await invoiceRepository.markInvoiceAsPending(id, tenantId);
      await invoiceRepository.addInvoicePayment(id, tenantId, 110, 'Bank Transfer', new Date());

      const result = await invoiceRepository.getInvoiceMonthlyRevenueTrend(12, tenantId);

      expect(result.length).toBeGreaterThan(0);
      const entry = result[result.length - 1];
      expect(entry.paid).toBe(110);
    });

    it('respects the limit parameter', async () => {
      await invoiceRepository.createInvoiceWithItems(createInvoiceInput({ customerId }), tenantId);

      const result = await invoiceRepository.getInvoiceMonthlyRevenueTrend(2, tenantId);
      expect(result.length).toBeLessThanOrEqual(2);
    });
  });

  describe('getInvoiceTopDebtors', () => {
    it('returns an empty array when no outstanding invoices exist', async () => {
      const result = await invoiceRepository.getInvoiceTopDebtors(5, tenantId);

      expect(result).toHaveLength(0);
    });

    it('returns customers with PENDING invoice balances', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );
      await invoiceRepository.markInvoiceAsPending(id, tenantId);

      const result = await invoiceRepository.getInvoiceTopDebtors(5, tenantId);

      expect(result).toHaveLength(1);
      expect(result[0].customerId).toBe(customerId);
      expect(result[0].customerName).toBe('Jane Smith');
      expect(result[0].amountDue).toBe(110);
      expect(result[0].invoiceCount).toBe(1);
    });

    it('excludes DRAFT invoices', async () => {
      await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );

      const result = await invoiceRepository.getInvoiceTopDebtors(5, tenantId);

      expect(result).toHaveLength(0);
    });

    it('only includes debtors belonging to the tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Debtors Isolation Tenant' });
      const otherCustomer = await customerRepository.createCustomer(
        createCustomerInput(),
        otherTenantId,
      );
      const { id: otherId } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId: otherCustomer.id }),
        otherTenantId,
      );
      await invoiceRepository.markInvoiceAsPending(otherId, otherTenantId);

      const result = await invoiceRepository.getInvoiceTopDebtors(5, tenantId);

      expect(result).toHaveLength(0);
    });

    it('includes PARTIALLY_PAID invoices and reflects net amountDue after payment', async () => {
      const { id } = await invoiceRepository.createInvoiceWithItems(
        createInvoiceInput({ customerId }),
        tenantId,
      );
      await invoiceRepository.markInvoiceAsPending(id, tenantId);
      // Pay 50 of 110 — invoice becomes PARTIALLY_PAID, amountDue = 60
      await invoiceRepository.addInvoicePayment(id, tenantId, 50, 'Credit Card', new Date());

      const result = await invoiceRepository.getInvoiceTopDebtors(5, tenantId);

      expect(result).toHaveLength(1);
      expect(result[0].amountDue).toBe(60);
    });

    it('respects the limit parameter', async () => {
      for (let i = 0; i < 3; i++) {
        const c = await customerRepository.createCustomer(
          createCustomerInput({ email: `debtor${i}@example.com` }),
          tenantId,
        );
        const { id } = await invoiceRepository.createInvoiceWithItems(
          createInvoiceInput({ customerId: c.id }),
          tenantId,
        );
        await invoiceRepository.markInvoiceAsPending(id, tenantId);
      }

      const result = await invoiceRepository.getInvoiceTopDebtors(2, tenantId);
      expect(result).toHaveLength(2);
    });
  });
});
