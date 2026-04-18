/**
 * QuoteRepository Integration Tests
 *
 * Tests the QuoteRepository against a real Postgres database spun up via
 * Testcontainers. No mocks — every assertion hits an actual DB query.
 *
 * Run with: pnpm test:integration
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { QuoteStatus } from '@/prisma/client';
import { QuoteRepository } from '@/repositories/quote-repository';
import { CustomerRepository } from '@/repositories/customer-repository';
import {
  setupTestDatabaseLifecycle,
  getTestPrisma,
  createTestTenant,
} from '@/lib/testing/integration/database';
import { createQuoteInput, createQuoteItemInput, createCustomerInput } from '@/lib/testing';

// Prevent the module-level singleton from running before the container is ready.
vi.mock('@/lib/prisma', () => ({ prisma: {} }));

// Mock the PDF service's import chain — it pulls in next-auth which cannot
// resolve in the Vitest environment.
vi.mock('@/features/finances/quotes/services/quote-pdf.service', () => ({
  getOrGenerateQuotePdf: vi
    .fn()
    .mockResolvedValue({ pdfBuffer: null, s3Key: '', s3Url: '', pdfUrl: '', pdfFilename: '' }),
}));

setupTestDatabaseLifecycle();

describe('QuoteRepository (integration)', () => {
  let quoteRepository: QuoteRepository;
  let customerRepository: CustomerRepository;
  let tenantId: string;
  let customerId: string;

  beforeAll(() => {
    quoteRepository = new QuoteRepository(getTestPrisma());
    customerRepository = new CustomerRepository(getTestPrisma());
  });

  beforeEach(async () => {
    ({ id: tenantId } = await createTestTenant({ name: 'Quote Test Tenant' }));
    const customer = await customerRepository.createCustomer(createCustomerInput(), tenantId);
    customerId = customer.id;
  });

  describe('createQuoteWithItems', () => {
    it('creates a quote and returns id and quoteNumber', async () => {
      const result = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId }),
        tenantId,
      );

      expect(result.id).toBeDefined();
      expect(result.quoteNumber).toMatch(/^QUO-\d{4}-\d{4}$/);
    });

    it('generates sequential quote numbers within the same tenant', async () => {
      const first = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId }),
        tenantId,
      );
      const second = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId }),
        tenantId,
      );

      const firstSeq = parseInt(first.quoteNumber.split('-')[2], 10);
      const secondSeq = parseInt(second.quoteNumber.split('-')[2], 10);

      expect(secondSeq).toBe(firstSeq + 1);
    });

    it('generates independent sequences per tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Quote Tenant' });
      const otherCustomer = await customerRepository.createCustomer(
        createCustomerInput(),
        otherTenantId,
      );

      const main = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId }),
        tenantId,
      );
      await quoteRepository.createQuoteWithItems(createQuoteInput({ customerId }), tenantId);
      const other = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId: otherCustomer.id }),
        otherTenantId,
      );

      const mainSeq = parseInt(main.quoteNumber.split('-')[2], 10);
      const otherSeq = parseInt(other.quoteNumber.split('-')[2], 10);

      expect(otherSeq).toBe(mainSeq);
    });
  });

  describe('findQuoteById', () => {
    it('returns full quote details', async () => {
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId }),
        tenantId,
      );

      const result = await quoteRepository.findQuoteById(id, tenantId);

      expect(result).not.toBeNull();
      if (!result) throw new Error('Expected result to not be null');
      expect(result.id).toBe(id);
      expect(result.customer.id).toBe(customerId);
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('converts Decimal fields to number', async () => {
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId }),
        tenantId,
      );

      const result = await quoteRepository.findQuoteById(id, tenantId);

      expect(result).not.toBeNull();
      if (!result) throw new Error('Expected result to not be null');
      expect(typeof result.amount).toBe('number');
      expect(typeof result.gst).toBe('number');
      expect(typeof result.discount).toBe('number');
    });

    it('returns null for a non-existent ID', async () => {
      const result = await quoteRepository.findQuoteById('cltest000000000000none0001', tenantId);
      expect(result).toBeNull();
    });

    it('returns null when ID belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Isolation Tenant A' });
      const otherCustomer = await customerRepository.createCustomer(
        createCustomerInput(),
        otherTenantId,
      );
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId: otherCustomer.id }),
        otherTenantId,
      );

      const result = await quoteRepository.findQuoteById(id, tenantId);
      expect(result).toBeNull();
    });
  });

  describe('searchQuotes', () => {
    it('returns only quotes scoped to the tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Search Isolation Tenant' });
      const otherCustomer = await customerRepository.createCustomer(
        createCustomerInput(),
        otherTenantId,
      );

      await quoteRepository.createQuoteWithItems(createQuoteInput({ customerId }), tenantId);
      await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId: otherCustomer.id }),
        otherTenantId,
      );

      const result = await quoteRepository.searchQuotes({ page: 1, perPage: 20 }, tenantId);

      expect(result.pagination.totalItems).toBe(1);
    });

    it('paginates correctly', async () => {
      await quoteRepository.createQuoteWithItems(createQuoteInput({ customerId }), tenantId);
      await quoteRepository.createQuoteWithItems(createQuoteInput({ customerId }), tenantId);
      await quoteRepository.createQuoteWithItems(createQuoteInput({ customerId }), tenantId);

      const result = await quoteRepository.searchQuotes({ page: 1, perPage: 2 }, tenantId);

      expect(result.items).toHaveLength(2);
      expect(result.pagination.totalItems).toBe(3);
      expect(result.pagination.totalPages).toBe(2);
    });
  });

  describe('softDeleteQuote', () => {
    it('soft-deletes a quote and hides it from subsequent finds', async () => {
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId }),
        tenantId,
      );

      await quoteRepository.softDeleteQuote(id, tenantId);

      const result = await quoteRepository.findQuoteById(id, tenantId);
      expect(result).toBeNull();
    });

    it('throws when quote not found', async () => {
      await expect(
        quoteRepository.softDeleteQuote('cltest000000000000none0001', tenantId),
      ).rejects.toThrow();
    });

    it('throws when quote belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Delete Isolation Tenant' });
      const otherCustomer = await customerRepository.createCustomer(
        createCustomerInput(),
        otherTenantId,
      );
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId: otherCustomer.id }),
        otherTenantId,
      );

      await expect(quoteRepository.softDeleteQuote(id, tenantId)).rejects.toThrow();
    });
  });

  describe('markQuoteAsAccepted', () => {
    it('transitions status from SENT to ACCEPTED', async () => {
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      await quoteRepository.markQuoteAsSent(id, tenantId);

      const result = await quoteRepository.markQuoteAsAccepted(id, tenantId);

      expect(result).not.toBeNull();
      if (!result) throw new Error('Expected result to not be null');
      expect(result.status).toBe('ACCEPTED');
    });

    it('returns null when quote not found', async () => {
      const result = await quoteRepository.markQuoteAsAccepted(
        'cltest000000000000none0001',
        tenantId,
      );
      expect(result).toBeNull();
    });

    it('cannot accept a quote belonging to another tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Accept Isolation Tenant' });
      const otherCustomer = await customerRepository.createCustomer(
        createCustomerInput(),
        otherTenantId,
      );
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId: otherCustomer.id, status: 'DRAFT' }),
        otherTenantId,
      );
      await quoteRepository.markQuoteAsSent(id, otherTenantId);

      const result = await quoteRepository.markQuoteAsAccepted(id, tenantId);
      expect(result).toBeNull();
    });
  });

  describe('markQuoteAsSent', () => {
    it('transitions status from DRAFT to SENT', async () => {
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );

      const result = await quoteRepository.markQuoteAsSent(id, tenantId);

      expect(result).not.toBeNull();
      if (!result) throw new Error('Expected result to not be null');
      expect(result.status).toBe('SENT');
    });

    it('returns null when quote not found', async () => {
      const result = await quoteRepository.markQuoteAsSent('cltest000000000000none0001', tenantId);
      expect(result).toBeNull();
    });
  });

  describe('markQuoteAsRejected', () => {
    it('transitions status from SENT to REJECTED', async () => {
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      await quoteRepository.markQuoteAsSent(id, tenantId);

      const result = await quoteRepository.markQuoteAsRejected(id, tenantId, 'Too expensive');

      expect(result).not.toBeNull();
      if (!result) throw new Error('Expected result to not be null');
      expect(result.status).toBe('REJECTED');
    });

    it('returns null when quote not found', async () => {
      const result = await quoteRepository.markQuoteAsRejected(
        'cltest000000000000none0001',
        tenantId,
        'reason',
      );
      expect(result).toBeNull();
    });
  });

  describe('duplicateQuote', () => {
    it('creates an independent copy with DRAFT status and a new quote number', async () => {
      const { id, quoteNumber } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({
          customerId,
          items: [createQuoteItemInput({ description: 'Original item', quantity: 2 })],
        }),
        tenantId,
      );

      const duplicate = await quoteRepository.duplicateQuote(id, tenantId);

      expect(duplicate.id).not.toBe(id);
      expect(duplicate.quoteNumber).not.toBe(quoteNumber);

      const duplicateDetails = await quoteRepository.findQuoteById(duplicate.id, tenantId);
      expect(duplicateDetails?.status).toBe('DRAFT');
      expect(duplicateDetails?.items).toHaveLength(1);
    });

    it('throws when quote not found', async () => {
      await expect(
        quoteRepository.duplicateQuote('cltest000000000000none0001', tenantId),
      ).rejects.toThrow('Quote not found');
    });
  });

  describe('createQuoteVersion', () => {
    it('creates a new version linked to the parent and starts as DRAFT', async () => {
      const { id: parentId } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId }),
        tenantId,
      );

      const newVersion = await quoteRepository.createQuoteVersion(parentId, tenantId);

      expect(newVersion.id).not.toBe(parentId);
      expect(newVersion.versionNumber).toBe(2);

      const versionDetails = await quoteRepository.findQuoteById(newVersion.id, tenantId);
      expect(versionDetails?.status).toBe('DRAFT');
      expect(versionDetails?.parentQuoteId).toBe(parentId);
    });

    it('throws when parent quote not found', async () => {
      await expect(
        quoteRepository.createQuoteVersion('cltest000000000000none0001', tenantId),
      ).rejects.toThrow('Parent quote not found');
    });
  });

  describe('toggleQuoteFavourite', () => {
    it('toggles isFavourite on and off', async () => {
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId }),
        tenantId,
      );

      const toggled = await quoteRepository.toggleQuoteFavourite(id, tenantId);
      expect(toggled?.isFavourite).toBe(true);

      const toggledBack = await quoteRepository.toggleQuoteFavourite(id, tenantId);
      expect(toggledBack?.isFavourite).toBe(false);
    });

    it('returns null when quote not found', async () => {
      const result = await quoteRepository.toggleQuoteFavourite(
        'cltest000000000000none0001',
        tenantId,
      );
      expect(result).toBeNull();
    });

    it('cannot toggle a quote belonging to another tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({
        name: 'Favourite Isolation Tenant',
      });
      const otherCustomer = await customerRepository.createCustomer(
        createCustomerInput(),
        otherTenantId,
      );
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId: otherCustomer.id }),
        otherTenantId,
      );

      const result = await quoteRepository.toggleQuoteFavourite(id, tenantId);
      expect(result).toBeNull();
    });
  });

  describe('findQuoteMetadata', () => {
    it('returns lightweight metadata with numeric fields but no items array', async () => {
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId }),
        tenantId,
      );

      const result = await quoteRepository.findQuoteMetadata(id, tenantId);

      expect(result).not.toBeNull();
      if (!result) throw new Error('Expected result to not be null');
      expect(result.id).toBe(id);
      expect(typeof result.amount).toBe('number');
      expect(result.customer.id).toBe(customerId);
      expect((result as Record<string, unknown>).items).toBeUndefined();
    });

    it('returns null for a non-existent ID', async () => {
      const result = await quoteRepository.findQuoteMetadata(
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
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId: otherCustomer.id }),
        otherTenantId,
      );

      const result = await quoteRepository.findQuoteMetadata(id, tenantId);
      expect(result).toBeNull();
    });
  });

  describe('findQuoteItems', () => {
    it('returns items for a quote with numeric prices', async () => {
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({
          customerId,
          items: [
            createQuoteItemInput({ description: 'Item A', quantity: 2, unitPrice: 50 }),
            createQuoteItemInput({ description: 'Item B', quantity: 1, unitPrice: 200 }),
          ],
        }),
        tenantId,
      );

      const items = await quoteRepository.findQuoteItems(id);

      expect(items).toHaveLength(2);
      expect(typeof items[0].unitPrice).toBe('number');
      expect(typeof items[0].total).toBe('number');
      const descriptions = items.map((i) => i.description);
      expect(descriptions).toContain('Item A');
      expect(descriptions).toContain('Item B');
    });

    it('returns empty array for a non-existent quote', async () => {
      const items = await quoteRepository.findQuoteItems('cltest000000000000none0001');
      expect(items).toHaveLength(0);
    });
  });

  describe('findQuoteStatusHistory', () => {
    it('returns history entries in ascending order after status changes', async () => {
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      await quoteRepository.markQuoteAsSent(id, tenantId);
      await quoteRepository.markQuoteAsAccepted(id, tenantId);

      const history = await quoteRepository.findQuoteStatusHistory(id);

      expect(history.length).toBeGreaterThanOrEqual(3);
      expect(history[0].status).toBe('DRAFT');
      expect(history[history.length - 1].status).toBe('ACCEPTED');
    });

    it('returns empty array for a non-existent quote', async () => {
      const history = await quoteRepository.findQuoteStatusHistory('cltest000000000000none0001');
      expect(history).toHaveLength(0);
    });
  });

  describe('generateQuoteNumber', () => {
    it('returns a number in QUO-YYYY-NNNN format starting at 0001', async () => {
      const number = await quoteRepository.generateQuoteNumber(tenantId);
      expect(number).toMatch(/^QUO-\d{4}-0001$/);
    });

    it('increments based on the highest existing quote number for the tenant', async () => {
      await quoteRepository.createQuoteWithItems(createQuoteInput({ customerId }), tenantId);

      const next = await quoteRepository.generateQuoteNumber(tenantId);
      const seq = parseInt(next.split('-')[2], 10);
      expect(seq).toBe(2);
    });
  });

  describe('quoteNumberExists', () => {
    it('returns true when the quote number exists', async () => {
      const { quoteNumber } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId }),
        tenantId,
      );

      const exists = await quoteRepository.quoteNumberExists(quoteNumber);
      expect(exists).toBe(true);
    });

    it('returns false when the quote number does not exist', async () => {
      const exists = await quoteRepository.quoteNumberExists('QUO-9999-9999');
      expect(exists).toBe(false);
    });

    it('returns false for own quote when excludeId is provided', async () => {
      const { id, quoteNumber } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId }),
        tenantId,
      );

      const exists = await quoteRepository.quoteNumberExists(quoteNumber, id);
      expect(exists).toBe(false);
    });
  });

  describe('countQuoteVersions', () => {
    it('returns 1 for a quote with no child versions', async () => {
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId }),
        tenantId,
      );

      const count = await quoteRepository.countQuoteVersions(id);
      expect(count).toBe(1);
    });

    it('returns 2 after creating a new version', async () => {
      const { id: parentId } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId }),
        tenantId,
      );
      const newVersion = await quoteRepository.createQuoteVersion(parentId, tenantId);

      const count = await quoteRepository.countQuoteVersions(newVersion.id);
      expect(count).toBe(2);
    });

    it('returns 0 for a non-existent quote', async () => {
      const count = await quoteRepository.countQuoteVersions('cltest000000000000none0001');
      expect(count).toBe(0);
    });
  });

  describe('getQuoteVersions', () => {
    it('returns all versions in the chain ordered by version number', async () => {
      const { id: parentId } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId }),
        tenantId,
      );
      await quoteRepository.createQuoteVersion(parentId, tenantId);

      const versions = await quoteRepository.getQuoteVersions(parentId);

      expect(versions).toHaveLength(2);
      expect(versions[0].versionNumber).toBe(1);
      expect(versions[1].versionNumber).toBe(2);
    });

    it('returns empty array for a non-existent quote', async () => {
      const versions = await quoteRepository.getQuoteVersions('cltest000000000000none0001');
      expect(versions).toHaveLength(0);
    });
  });

  describe('updateQuoteWithItems', () => {
    it('replaces items and returns updated quote with recalculated amount', async () => {
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({
          customerId,
          items: [createQuoteItemInput({ description: 'Old item', unitPrice: 100 })],
        }),
        tenantId,
      );

      const updated = await quoteRepository.updateQuoteWithItems(
        id,
        {
          id,
          customerId,
          status: 'DRAFT',
          currency: 'AUD',
          gst: 10,
          discount: 0,
          issuedDate: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          items: [createQuoteItemInput({ description: 'New item', unitPrice: 200 })],
        },
        tenantId,
      );

      expect(updated).not.toBeNull();
      if (!updated) throw new Error('Expected result to not be null');
      expect(updated.items).toHaveLength(1);
      expect(updated.items[0].description).toBe('New item');
      expect(updated.items[0].unitPrice).toBe(200);
    });

    it('creates a status history entry when status changes', async () => {
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );

      await quoteRepository.updateQuoteWithItems(
        id,
        {
          id,
          customerId,
          status: 'SENT',
          currency: 'AUD',
          gst: 10,
          discount: 0,
          issuedDate: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          items: [createQuoteItemInput()],
        },
        tenantId,
      );

      const history = await quoteRepository.findQuoteStatusHistory(id);
      expect(history.some((h) => h.status === 'SENT')).toBe(true);
    });

    it('throws when quote not found', async () => {
      await expect(
        quoteRepository.updateQuoteWithItems(
          'cltest000000000000none0001',
          {
            id: 'cltest000000000000none0001',
            customerId,
            status: 'DRAFT',
            currency: 'AUD',
            gst: 10,
            discount: 0,
            issuedDate: new Date(),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            items: [createQuoteItemInput()],
          },
          tenantId,
        ),
      ).rejects.toThrow('Quote not found');
    });
  });

  describe('markQuoteAsOnHold', () => {
    it('transitions from SENT to ON_HOLD and records the reason', async () => {
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      await quoteRepository.markQuoteAsSent(id, tenantId);

      const result = await quoteRepository.markQuoteAsOnHold(id, tenantId, 'Waiting on approval');

      expect(result).not.toBeNull();
      if (!result) throw new Error('Expected result to not be null');
      expect(result.status).toBe('ON_HOLD');
    });

    it('returns null when quote not found', async () => {
      const result = await quoteRepository.markQuoteAsOnHold(
        'cltest000000000000none0001',
        tenantId,
      );
      expect(result).toBeNull();
    });

    it('returns null when quote belongs to another tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'OnHold Isolation Tenant' });
      const otherCustomer = await customerRepository.createCustomer(
        createCustomerInput(),
        otherTenantId,
      );
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId: otherCustomer.id, status: 'DRAFT' }),
        otherTenantId,
      );
      await quoteRepository.markQuoteAsSent(id, otherTenantId);

      const result = await quoteRepository.markQuoteAsOnHold(id, tenantId);
      expect(result).toBeNull();
    });
  });

  describe('markQuoteAsCancelled', () => {
    it('transitions from DRAFT to CANCELLED with a reason', async () => {
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );

      const result = await quoteRepository.markQuoteAsCancelled(
        id,
        tenantId,
        'Customer changed mind',
      );

      expect(result).not.toBeNull();
      if (!result) throw new Error('Expected result to not be null');
      expect(result.status).toBe('CANCELLED');
    });

    it('returns null when quote not found', async () => {
      const result = await quoteRepository.markQuoteAsCancelled(
        'cltest000000000000none0001',
        tenantId,
      );
      expect(result).toBeNull();
    });

    it('returns null when quote belongs to another tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Cancel Isolation Tenant' });
      const otherCustomer = await customerRepository.createCustomer(
        createCustomerInput(),
        otherTenantId,
      );
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId: otherCustomer.id }),
        otherTenantId,
      );

      const result = await quoteRepository.markQuoteAsCancelled(id, tenantId);
      expect(result).toBeNull();
    });
  });

  describe('convertQuoteToInvoice', () => {
    it('creates an invoice from an accepted quote and transitions it to CONVERTED', async () => {
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      await quoteRepository.markQuoteAsSent(id, tenantId);
      await quoteRepository.markQuoteAsAccepted(id, tenantId);

      const result = await quoteRepository.convertQuoteToInvoice(id, {
        invoiceNumber: 'INV-2024-C001',
        tenantId,
        gst: 10,
        discount: 0,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      expect(result.invoiceId).toBeDefined();
      expect(result.invoiceNumber).toBe('INV-2024-C001');

      const quote = await quoteRepository.findQuoteById(id, tenantId);
      expect(quote?.status).toBe('CONVERTED');
      expect(quote?.invoiceId).toBe(result.invoiceId);
    });

    it('throws when quote not found', async () => {
      await expect(
        quoteRepository.convertQuoteToInvoice('cltest000000000000none0001', {
          invoiceNumber: 'INV-2024-C002',
          tenantId,
          gst: 10,
          discount: 0,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }),
      ).rejects.toThrow('Quote not found');
    });

    it('throws when status transition is invalid (DRAFT → CONVERTED)', async () => {
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );

      await expect(
        quoteRepository.convertQuoteToInvoice(id, {
          invoiceNumber: 'INV-2024-C003',
          tenantId,
          gst: 10,
          discount: 0,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }),
      ).rejects.toThrow();
    });
  });

  describe('checkAndExpireQuotes', () => {
    it('expires DRAFT and SENT quotes past their validUntil date', async () => {
      const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

      const { id: draftId } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, status: 'DRAFT', validUntil: pastDate }),
        tenantId,
      );
      const { id: sentId } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, status: 'DRAFT', validUntil: pastDate }),
        tenantId,
      );
      await quoteRepository.markQuoteAsSent(sentId, tenantId);

      const count = await quoteRepository.checkAndExpireQuotes();

      expect(count).toBeGreaterThanOrEqual(2);

      const draftResult = await quoteRepository.findQuoteById(draftId, tenantId);
      const sentResult = await quoteRepository.findQuoteById(sentId, tenantId);
      expect(draftResult?.status).toBe('EXPIRED');
      expect(sentResult?.status).toBe('EXPIRED');
    });

    it('does not expire quotes with a future validUntil', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, status: 'DRAFT', validUntil: futureDate }),
        tenantId,
      );

      await quoteRepository.checkAndExpireQuotes();

      const result = await quoteRepository.findQuoteById(id, tenantId);
      expect(result?.status).toBe('DRAFT');
    });

    it('returns 0 when no quotes are due to expire', async () => {
      const count = await quoteRepository.checkAndExpireQuotes();
      expect(count).toBe(0);
    });
  });

  describe('bulkUpdateQuoteStatus', () => {
    it('updates multiple quotes and returns success for each', async () => {
      const q1 = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      const q2 = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );

      const results = await quoteRepository.bulkUpdateQuoteStatus(
        [q1.id, q2.id],
        QuoteStatus.SENT,
        tenantId,
      );

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it('returns failure for a non-existent quote without failing the batch', async () => {
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );

      const results = await quoteRepository.bulkUpdateQuoteStatus(
        [id, 'cltest000000000000none0001'],
        QuoteStatus.SENT,
        tenantId,
      );

      expect(results.find((r) => r.id === id)?.success).toBe(true);
      expect(results.find((r) => r.id === 'cltest000000000000none0001')?.success).toBe(false);
    });

    it('returns failure for an invalid status transition (DRAFT → ACCEPTED)', async () => {
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );

      const results = await quoteRepository.bulkUpdateQuoteStatus(
        [id],
        QuoteStatus.ACCEPTED,
        tenantId,
      );

      expect(results[0].success).toBe(false);
      expect(results[0].error).toBeDefined();
    });

    it('succeeds without error when quote is already at the target status', async () => {
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );

      const results = await quoteRepository.bulkUpdateQuoteStatus(
        [id],
        QuoteStatus.DRAFT,
        tenantId,
      );

      expect(results[0].success).toBe(true);
    });

    it('does not update quotes belonging to another tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Bulk Status Isolation' });
      const otherCustomer = await customerRepository.createCustomer(
        createCustomerInput(),
        otherTenantId,
      );
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId: otherCustomer.id, status: 'DRAFT' }),
        otherTenantId,
      );

      const results = await quoteRepository.bulkUpdateQuoteStatus([id], QuoteStatus.SENT, tenantId);

      expect(results[0].success).toBe(false);
    });
  });

  describe('bulkSoftDeleteQuotes', () => {
    it('soft-deletes DRAFT quotes and returns success for each', async () => {
      const q1 = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      const q2 = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );

      const results = await quoteRepository.bulkSoftDeleteQuotes([q1.id, q2.id], tenantId);

      expect(results.every((r) => r.success)).toBe(true);
      expect(await quoteRepository.findQuoteById(q1.id, tenantId)).toBeNull();
      expect(await quoteRepository.findQuoteById(q2.id, tenantId)).toBeNull();
    });

    it('rejects non-DRAFT quotes and returns an error message', async () => {
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      await quoteRepository.markQuoteAsSent(id, tenantId);

      const results = await quoteRepository.bulkSoftDeleteQuotes([id], tenantId);

      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('DRAFT');
    });

    it('returns failure for a non-existent quote without throwing', async () => {
      const results = await quoteRepository.bulkSoftDeleteQuotes(
        ['cltest000000000000none0001'],
        tenantId,
      );

      expect(results[0].success).toBe(false);
      expect(results[0].error).toBeDefined();
    });
  });

  describe('createQuoteItemAttachment / findQuoteItemAttachments', () => {
    it('creates an attachment and retrieves it by item ID', async () => {
      const { id: quoteId } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId }),
        tenantId,
      );
      const items = await quoteRepository.findQuoteItems(quoteId);
      const itemId = items[0].id;

      await quoteRepository.createQuoteItemAttachment({
        quoteItemId: itemId,
        fileName: 'design.png',
        fileSize: 12345,
        mimeType: 'image/png',
        s3Key: 'quotes/design.png',
        s3Url: 'https://s3.example.com/quotes/design.png',
      });

      const attachments = await quoteRepository.findQuoteItemAttachments(itemId);
      expect(attachments).toHaveLength(1);
      expect(attachments[0].fileName).toBe('design.png');
    });

    it('returns empty array when item has no attachments', async () => {
      const { id: quoteId } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId }),
        tenantId,
      );
      const items = await quoteRepository.findQuoteItems(quoteId);

      const attachments = await quoteRepository.findQuoteItemAttachments(items[0].id);
      expect(attachments).toHaveLength(0);
    });
  });

  describe('updateQuoteItemNotes', () => {
    it('updates the notes field and persists to the database', async () => {
      const { id: quoteId } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId }),
        tenantId,
      );
      const items = await quoteRepository.findQuoteItems(quoteId);
      const itemId = items[0].id;

      await quoteRepository.updateQuoteItemNotes(itemId, 'Rush order — priority handling');

      const updatedItems = await quoteRepository.findQuoteItems(quoteId);
      expect(updatedItems[0].notes).toBe('Rush order — priority handling');
    });

    it('clears notes when an empty string is provided', async () => {
      const { id: quoteId } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId }),
        tenantId,
      );
      const items = await quoteRepository.findQuoteItems(quoteId);
      await quoteRepository.updateQuoteItemNotes(items[0].id, 'Some note');
      await quoteRepository.updateQuoteItemNotes(items[0].id, '');

      const updatedItems = await quoteRepository.findQuoteItems(quoteId);
      expect(updatedItems[0].notes).toBe('');
    });
  });

  // -- updateQuoteItemColors ---------------------------------------------------
  describe('updateQuoteItemColors', () => {
    it('persists an array of colour hex values', async () => {
      const { id: quoteId } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId }),
        tenantId,
      );
      const items = await quoteRepository.findQuoteItems(quoteId);

      await quoteRepository.updateQuoteItemColors(items[0].id, ['#FF0000', '#00FF00', '#0000FF']);

      const updatedItems = await quoteRepository.findQuoteItems(quoteId);
      expect(updatedItems[0].colors).toEqual(['#FF0000', '#00FF00', '#0000FF']);
    });

    it('replaces existing colours when updated again', async () => {
      const { id: quoteId } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId }),
        tenantId,
      );
      const items = await quoteRepository.findQuoteItems(quoteId);
      await quoteRepository.updateQuoteItemColors(items[0].id, ['#AAAAAA']);
      await quoteRepository.updateQuoteItemColors(items[0].id, ['#111111', '#222222']);

      const updatedItems = await quoteRepository.findQuoteItems(quoteId);
      expect(updatedItems[0].colors).toEqual(['#111111', '#222222']);
    });
  });

  describe('findQuoteItemAttachmentById', () => {
    it('returns the attachment when found', async () => {
      const { id: quoteId } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId }),
        tenantId,
      );
      const items = await quoteRepository.findQuoteItems(quoteId);
      const attachment = await quoteRepository.createQuoteItemAttachment({
        quoteItemId: items[0].id,
        fileName: 'mockup.pdf',
        fileSize: 99999,
        mimeType: 'application/pdf',
        s3Key: 'quotes/mockup.pdf',
        s3Url: 'https://s3.example.com/quotes/mockup.pdf',
      });

      const result = await quoteRepository.findQuoteItemAttachmentById(attachment.id);
      expect(result).not.toBeNull();
      expect(result?.fileName).toBe('mockup.pdf');
    });

    it('returns null for a non-existent attachment', async () => {
      const result = await quoteRepository.findQuoteItemAttachmentById(
        'cltest000000000000none0001',
      );
      expect(result).toBeNull();
    });
  });

  describe('deleteQuoteItemAttachment', () => {
    it('deletes attachment and returns true', async () => {
      const { id: quoteId } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId }),
        tenantId,
      );
      const items = await quoteRepository.findQuoteItems(quoteId);
      const attachment = await quoteRepository.createQuoteItemAttachment({
        quoteItemId: items[0].id,
        fileName: 'delete-me.png',
        fileSize: 1000,
        mimeType: 'image/png',
        s3Key: 'quotes/delete-me.png',
        s3Url: 'https://s3.example.com/quotes/delete-me.png',
      });

      const deleted = await quoteRepository.deleteQuoteItemAttachment(attachment.id);
      expect(deleted).toBe(true);
      expect(await quoteRepository.findQuoteItemAttachmentById(attachment.id)).toBeNull();
    });

    it('returns false for a non-existent attachment', async () => {
      const result = await quoteRepository.deleteQuoteItemAttachment('cltest000000000000none0001');
      expect(result).toBe(false);
    });
  });

  describe('countQuoteItemAttachments', () => {
    it('returns the correct count of attachments for an item', async () => {
      const { id: quoteId } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId }),
        tenantId,
      );
      const items = await quoteRepository.findQuoteItems(quoteId);
      const itemId = items[0].id;

      await quoteRepository.createQuoteItemAttachment({
        quoteItemId: itemId,
        fileName: 'a.png',
        fileSize: 100,
        mimeType: 'image/png',
        s3Key: 'quotes/a.png',
        s3Url: 'https://s3.example.com/quotes/a.png',
      });
      await quoteRepository.createQuoteItemAttachment({
        quoteItemId: itemId,
        fileName: 'b.png',
        fileSize: 200,
        mimeType: 'image/png',
        s3Key: 'quotes/b.png',
        s3Url: 'https://s3.example.com/quotes/b.png',
      });

      const count = await quoteRepository.countQuoteItemAttachments(itemId);
      expect(count).toBe(2);
    });

    it('returns 0 when item has no attachments', async () => {
      const { id: quoteId } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId }),
        tenantId,
      );
      const items = await quoteRepository.findQuoteItems(quoteId);

      const count = await quoteRepository.countQuoteItemAttachments(items[0].id);
      expect(count).toBe(0);
    });
  });

  describe('countQuoteItemAttachmentsByS3Key', () => {
    it('counts other attachments sharing the same S3 key, excluding the given ID', async () => {
      const { id: quoteId } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId }),
        tenantId,
      );
      const items = await quoteRepository.findQuoteItems(quoteId);
      const itemId = items[0].id;
      const sharedKey = 'quotes/shared-asset.png';

      const a1 = await quoteRepository.createQuoteItemAttachment({
        quoteItemId: itemId,
        fileName: 'copy1.png',
        fileSize: 500,
        mimeType: 'image/png',
        s3Key: sharedKey,
        s3Url: 'https://s3.example.com/quotes/shared-asset.png',
      });
      await quoteRepository.createQuoteItemAttachment({
        quoteItemId: itemId,
        fileName: 'copy2.png',
        fileSize: 500,
        mimeType: 'image/png',
        s3Key: sharedKey,
        s3Url: 'https://s3.example.com/quotes/shared-asset.png',
      });

      const count = await quoteRepository.countQuoteItemAttachmentsByS3Key(sharedKey, a1.id);
      expect(count).toBe(1);
    });

    it('returns 0 when no other attachments share the S3 key', async () => {
      const { id: quoteId } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId }),
        tenantId,
      );
      const items = await quoteRepository.findQuoteItems(quoteId);
      const attachment = await quoteRepository.createQuoteItemAttachment({
        quoteItemId: items[0].id,
        fileName: 'unique.png',
        fileSize: 100,
        mimeType: 'image/png',
        s3Key: 'quotes/unique-asset.png',
        s3Url: 'https://s3.example.com/quotes/unique-asset.png',
      });

      const count = await quoteRepository.countQuoteItemAttachmentsByS3Key(
        'quotes/unique-asset.png',
        attachment.id,
      );
      expect(count).toBe(0);
    });
  });

  describe('getQuoteStatistics', () => {
    it('returns correct status counts for the tenant', async () => {
      await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      const { id: sentId } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      await quoteRepository.markQuoteAsSent(sentId, tenantId);

      const stats = await quoteRepository.getQuoteStatistics(tenantId);

      expect(stats.total).toBe(2);
      expect(stats.draft).toBe(1);
      expect(stats.sent).toBe(1);
      expect(stats.totalQuotedValue).toBeGreaterThan(0);
    });

    it('scopes statistics to the tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Stats Isolation Tenant' });
      const otherCustomer = await customerRepository.createCustomer(
        createCustomerInput(),
        otherTenantId,
      );
      await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId: otherCustomer.id }),
        otherTenantId,
      );
      await quoteRepository.createQuoteWithItems(createQuoteInput({ customerId }), tenantId);

      const stats = await quoteRepository.getQuoteStatistics(tenantId);
      expect(stats.total).toBe(1);
    });

    it('returns zeroed stats for a tenant with no quotes', async () => {
      const stats = await quoteRepository.getQuoteStatistics(tenantId);
      expect(stats.total).toBe(0);
      expect(stats.totalQuotedValue).toBe(0);
    });

    it('filters by date range when provided', async () => {
      const past = new Date(2020, 0, 15);
      const recent = new Date();

      await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, issuedDate: past, validUntil: new Date(2020, 1, 15) }),
        tenantId,
      );
      await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, issuedDate: recent }),
        tenantId,
      );

      const stats = await quoteRepository.getQuoteStatistics(tenantId, {
        startDate: new Date(2021, 0, 1),
      });

      expect(stats.total).toBe(1);
    });
  });

  describe('getMonthlyQuoteValueTrend', () => {
    it('returns monthly aggregated data including the current month', async () => {
      await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, issuedDate: new Date() }),
        tenantId,
      );

      const trend = await quoteRepository.getMonthlyQuoteValueTrend(12, tenantId);

      expect(Array.isArray(trend)).toBe(true);
      expect(trend.length).toBeGreaterThanOrEqual(1);
      expect(trend[trend.length - 1].total).toBeGreaterThan(0);
    });

    it('returns empty array for a tenant with no quotes', async () => {
      const trend = await quoteRepository.getMonthlyQuoteValueTrend(12, tenantId);
      expect(trend).toHaveLength(0);
    });

    it('respects the limit parameter', async () => {
      const trend = await quoteRepository.getMonthlyQuoteValueTrend(2, tenantId);
      expect(trend.length).toBeLessThanOrEqual(2);
    });
  });

  describe('getConversionFunnel', () => {
    it('returns funnel counts with correct accepted value', async () => {
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      await quoteRepository.markQuoteAsSent(id, tenantId);
      await quoteRepository.markQuoteAsAccepted(id, tenantId);

      const funnel = await quoteRepository.getConversionFunnel(tenantId);

      expect(funnel.accepted).toBe(1);
      expect(funnel.acceptedValue).toBeGreaterThan(0);
    });

    it('returns zeros for a tenant with no quotes', async () => {
      const funnel = await quoteRepository.getConversionFunnel(tenantId);
      expect(funnel.sent).toBe(0);
      expect(funnel.accepted).toBe(0);
      expect(funnel.converted).toBe(0);
    });

    it('scopes funnel data to the tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Funnel Isolation Tenant' });
      const otherCustomer = await customerRepository.createCustomer(
        createCustomerInput(),
        otherTenantId,
      );
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId: otherCustomer.id, status: 'DRAFT' }),
        otherTenantId,
      );
      await quoteRepository.markQuoteAsSent(id, otherTenantId);

      const funnel = await quoteRepository.getConversionFunnel(tenantId);
      expect(funnel.sent).toBe(0);
    });
  });

  describe('getTopCustomersByQuotedValue', () => {
    it('returns customers ordered by total quoted value descending', async () => {
      const bigSpender = await customerRepository.createCustomer(
        createCustomerInput({ email: 'bigspender@example.com' }),
        tenantId,
      );

      await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, items: [createQuoteItemInput({ unitPrice: 100 })] }),
        tenantId,
      );
      await quoteRepository.createQuoteWithItems(
        createQuoteInput({
          customerId: bigSpender.id,
          items: [createQuoteItemInput({ unitPrice: 5000 })],
        }),
        tenantId,
      );

      const top = await quoteRepository.getTopCustomersByQuotedValue(5, tenantId);

      expect(top).toHaveLength(2);
      expect(top[0].totalQuotedValue).toBeGreaterThan(top[1].totalQuotedValue);
      expect(top[0].customerId).toBe(bigSpender.id);
    });

    it('returns empty array for a tenant with no quotes', async () => {
      const top = await quoteRepository.getTopCustomersByQuotedValue(5, tenantId);
      expect(top).toHaveLength(0);
    });

    it('respects the limit parameter', async () => {
      for (let i = 0; i < 3; i++) {
        const c = await customerRepository.createCustomer(
          createCustomerInput({ email: `topcustomer${i}@example.com` }),
          tenantId,
        );
        await quoteRepository.createQuoteWithItems(
          createQuoteInput({ customerId: c.id }),
          tenantId,
        );
      }

      const top = await quoteRepository.getTopCustomersByQuotedValue(2, tenantId);
      expect(top).toHaveLength(2);
    });
  });

  describe('getAverageTimeToDecision', () => {
    it('returns numeric average fields after quotes reach a decision', async () => {
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      await quoteRepository.markQuoteAsSent(id, tenantId);
      await quoteRepository.markQuoteAsAccepted(id, tenantId);

      const result = await quoteRepository.getAverageTimeToDecision(tenantId);

      expect(typeof result.avgDaysToAccept).toBe('number');
      expect(typeof result.avgDaysToReject).toBe('number');
      expect(typeof result.avgDaysToDecision).toBe('number');
      expect(result.avgDaysToAccept).toBeGreaterThanOrEqual(0);
    });

    it('returns zeros when no quotes have reached a decision', async () => {
      const result = await quoteRepository.getAverageTimeToDecision(tenantId);

      expect(result.avgDaysToAccept).toBe(0);
      expect(result.avgDaysToReject).toBe(0);
      expect(result.avgDaysToDecision).toBe(0);
    });

    it('calculates rejection average independently from acceptance', async () => {
      const { id } = await quoteRepository.createQuoteWithItems(
        createQuoteInput({ customerId, status: 'DRAFT' }),
        tenantId,
      );
      await quoteRepository.markQuoteAsSent(id, tenantId);
      await quoteRepository.markQuoteAsRejected(id, tenantId, 'Too expensive');

      const result = await quoteRepository.getAverageTimeToDecision(tenantId);

      expect(result.avgDaysToReject).toBeGreaterThanOrEqual(0);
      expect(result.avgDaysToAccept).toBe(0);
    });
  });
});
