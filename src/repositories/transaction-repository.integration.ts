/**
 * TransactionRepository Integration Tests
 *
 * Tests the repository against a real Postgres database spun up via
 * Testcontainers. No mocks — every assertion hits an actual DB query.
 *
 * Run with: pnpm test:integration
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { TransactionRepository } from './transaction-repository';
import {
  setupTestDatabaseLifecycle,
  getTestPrisma,
  createTestTenant,
} from '@/lib/testing/integration/database';
import { createTransactionInput } from '@/lib/testing';

setupTestDatabaseLifecycle();

// -- Shared fixture ----------------------------------------------------------

const transactionInput = createTransactionInput();

// -- Tests -------------------------------------------------------------------

describe('TransactionRepository (integration)', () => {
  let repository: TransactionRepository;
  let tenantId: string;
  let categoryId: string;

  beforeAll(() => {
    repository = new TransactionRepository(getTestPrisma());
  });

  beforeEach(async () => {
    ({ id: tenantId } = await createTestTenant({ name: 'Transaction Test Tenant' }));

    // TODO: Create transactionCategory repository and use it here
    // Create a category so createTransaction can link to it
    const category = await getTestPrisma().transactionCategory.create({
      data: { tenantId, name: 'Test Category', isActive: true },
    });
    categoryId = category.id;
  });

  describe('createTransaction', () => {
    it('creates a transaction and returns it with details', async () => {
      const result = await repository.createTransaction(
        { ...transactionInput, categoryIds: [categoryId] },
        tenantId,
      );

      expect(result.id).toBeDefined();
      expect(result.type).toBe('INCOME');
      expect(result.amount).toBe(100);
      expect(result.referenceNumber).toMatch(/^TRX-/);
    });

    it('auto-generates a unique reference number', async () => {
      const [a, b] = await Promise.all([
        repository.createTransaction({ ...transactionInput, categoryIds: [categoryId] }, tenantId),
        repository.createTransaction({ ...transactionInput, categoryIds: [categoryId] }, tenantId),
      ]);

      expect(a.referenceNumber).not.toBe(b.referenceNumber);
    });

    it('links categories when categoryIds are provided', async () => {
      const result = await repository.createTransaction(
        { ...transactionInput, categoryIds: [categoryId] },
        tenantId,
      );

      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].category.id).toBe(categoryId);
    });

    it('creates a transaction without categories when categoryIds is omitted', async () => {
      const { categoryIds: _, ...inputWithoutCategories } = transactionInput;
      const result = await repository.createTransaction(inputWithoutCategories, tenantId);

      expect(result.categories).toHaveLength(0);
    });
  });

  describe('findByIdWithDetails', () => {
    it('returns a transaction with details when found', async () => {
      const created = await repository.createTransaction(
        { ...transactionInput, categoryIds: [categoryId] },
        tenantId,
      );
      const result = await repository.findByIdWithDetails(created.id, tenantId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.categories).toHaveLength(1);
    });

    it('returns null for a non-existent ID', async () => {
      const result = await repository.findByIdWithDetails('cltest000000000000none0001', tenantId);
      expect(result).toBeNull();
    });

    it('returns null when ID belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      const created = await repository.createTransaction(
        { ...transactionInput, categoryIds: undefined },
        otherTenantId,
      );

      const result = await repository.findByIdWithDetails(created.id, tenantId);
      expect(result).toBeNull();
    });
  });

  describe('searchAndPaginate', () => {
    it('returns paginated transactions for the tenant', async () => {
      await repository.createTransaction(
        { ...transactionInput, categoryIds: [categoryId] },
        tenantId,
      );

      const result = await repository.searchAndPaginate({ page: 1, perPage: 10 }, tenantId);

      expect(result.items.length).toBeGreaterThanOrEqual(1);
      expect(result.pagination.totalItems).toBeGreaterThanOrEqual(1);
    });

    it('does not return transactions from other tenants', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      await repository.createTransaction(
        { ...transactionInput, categoryIds: undefined },
        otherTenantId,
      );
      await repository.createTransaction(
        { ...transactionInput, categoryIds: [categoryId] },
        tenantId,
      );

      const result = await repository.searchAndPaginate({ page: 1, perPage: 10 }, tenantId);

      expect(result.pagination.totalItems).toBe(1);
    });

    it('filters by type', async () => {
      await repository.createTransaction(
        { ...transactionInput, type: 'INCOME', categoryIds: [categoryId] },
        tenantId,
      );
      await repository.createTransaction(
        { ...transactionInput, type: 'EXPENSE', categoryIds: [categoryId] },
        tenantId,
      );

      const result = await repository.searchAndPaginate(
        { page: 1, perPage: 10, type: ['INCOME'] },
        tenantId,
      );

      expect(result.items.every((t) => t.type === 'INCOME')).toBe(true);
    });

    it('filters by search term across description and payee', async () => {
      await repository.createTransaction(
        { ...transactionInput, description: 'Unique payslip', categoryIds: [categoryId] },
        tenantId,
      );
      await repository.createTransaction(
        { ...transactionInput, description: 'Office rent', categoryIds: [categoryId] },
        tenantId,
      );

      const result = await repository.searchAndPaginate(
        { page: 1, perPage: 10, search: 'payslip' },
        tenantId,
      );

      expect(result.items.every((t) => t.description === 'Unique payslip')).toBe(true);
    });
  });

  describe('updateTransaction', () => {
    it('updates fields and returns the updated record', async () => {
      const created = await repository.createTransaction(
        { ...transactionInput, categoryIds: [categoryId] },
        tenantId,
      );
      const result = await repository.updateTransaction(created.id, tenantId, {
        ...transactionInput,
        categoryIds: [categoryId],
        payee: 'Updated Payee',
      });

      expect(result).not.toBeNull();
      expect(result?.payee).toBe('Updated Payee');
    });

    it('returns null when ID belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      const created = await repository.createTransaction(
        { ...transactionInput, categoryIds: undefined },
        otherTenantId,
      );

      await expect(
        repository.updateTransaction(created.id, tenantId, {
          ...transactionInput,
          categoryIds: [categoryId],
        }),
      ).rejects.toThrow();
    });
  });

  describe('deleteTransaction', () => {
    it('deletes the transaction and returns its ID', async () => {
      const created = await repository.createTransaction(
        { ...transactionInput, categoryIds: [categoryId] },
        tenantId,
      );
      const result = await repository.deleteTransaction(created.id, tenantId);

      expect(result.id).toBe(created.id);

      const gone = await repository.findByIdWithDetails(created.id, tenantId);
      expect(gone).toBeNull();
    });

    it('throws when ID belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      const created = await repository.createTransaction(
        { ...transactionInput, categoryIds: undefined },
        otherTenantId,
      );

      await expect(repository.deleteTransaction(created.id, tenantId)).rejects.toThrow();
    });
  });

  describe('findOrCreateCategory', () => {
    it('creates a new category when it does not exist', async () => {
      const result = await repository.findOrCreateCategory('New Category', tenantId);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('New Category');
    });

    it('returns the existing category when name already exists', async () => {
      const first = await repository.findOrCreateCategory('Duplicate', tenantId);
      const second = await repository.findOrCreateCategory('Duplicate', tenantId);

      expect(first.id).toBe(second.id);
    });

    it('is case-insensitive when finding existing categories', async () => {
      const first = await repository.findOrCreateCategory('Sales', tenantId);
      const second = await repository.findOrCreateCategory('SALES', tenantId);

      expect(first.id).toBe(second.id);
    });

    it('does not share categories across tenants', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      const first = await repository.findOrCreateCategory('Shared Name', tenantId);
      const second = await repository.findOrCreateCategory('Shared Name', otherTenantId);

      expect(first.id).not.toBe(second.id);
    });
  });

  describe('getActiveCategories', () => {
    it('returns only active categories for the tenant', async () => {
      await getTestPrisma().transactionCategory.create({
        data: { tenantId, name: 'Inactive Category', isActive: false },
      });

      const result = await repository.getActiveCategories(tenantId);

      expect(result.some((c) => c.name === 'Test Category')).toBe(true);
      expect(result.every((c) => c.name !== 'Inactive Category')).toBe(true);
    });

    it('does not return categories from other tenants', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      await getTestPrisma().transactionCategory.create({
        data: { tenantId: otherTenantId, name: 'Other Category', isActive: true },
      });

      const result = await repository.getActiveCategories(tenantId);

      expect(result.every((c) => c.name !== 'Other Category')).toBe(true);
    });
  });
});
