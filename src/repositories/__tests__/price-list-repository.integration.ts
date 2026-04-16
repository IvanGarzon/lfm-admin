/**
 * PriceListRepository Integration Tests
 *
 * Tests the repository against a real Postgres database spun up via
 * Testcontainers. No mocks — every assertion hits an actual DB query.
 *
 * Run with: pnpm test:integration
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { PriceListRepository } from '../price-list-repository';
import {
  setupTestDatabaseLifecycle,
  getTestPrisma,
  createTestTenant,
} from '@/lib/testing/integration/database';
import { createPriceListItemInput, createUpdatePriceListItemInput } from '@/lib/testing';

// Prevent the module-level singleton from running before the container is ready.
vi.mock('@/lib/prisma', () => ({ prisma: {} }));

setupTestDatabaseLifecycle();

// -- Tests -------------------------------------------------------------------

describe('PriceListRepository (integration)', () => {
  let repository: PriceListRepository;
  let tenantId: string;

  beforeAll(() => {
    repository = new PriceListRepository(getTestPrisma());
  });

  beforeEach(async () => {
    ({ id: tenantId } = await createTestTenant({ name: 'Price List Test Tenant' }));
  });

  // -- createPriceListItem ---------------------------------------------------

  describe('createPriceListItem', () => {
    it('creates an item and returns its ID', async () => {
      const result = await repository.createPriceListItem(createPriceListItemInput(), tenantId);

      expect(result.id).toBeDefined();
    });

    it('calculates retailPrice from costPerUnit × multiplier', async () => {
      const { id } = await repository.createPriceListItem(
        createPriceListItemInput({ costPerUnit: 2, multiplier: 3 }),
        tenantId,
      );

      const saved = await repository.findPriceListItemById(id, tenantId);
      expect(saved!.retailPrice).toBeCloseTo(6);
    });

    it('uses retailPriceOverride when set', async () => {
      const { id } = await repository.createPriceListItem(
        createPriceListItemInput({ costPerUnit: 2, multiplier: 3, retailPriceOverride: 10 }),
        tenantId,
      );

      const saved = await repository.findPriceListItemById(id, tenantId);
      expect(saved!.retailPrice).toBeCloseTo(10);
    });
  });

  // -- findPriceListItemById -------------------------------------------------

  describe('findPriceListItemById', () => {
    it('returns item with cost history', async () => {
      const { id } = await repository.createPriceListItem(createPriceListItemInput(), tenantId);

      const result = await repository.findPriceListItemById(id, tenantId);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(id);
      expect(result!.name).toBe('Red Roses');
      expect(Array.isArray(result!.costHistory)).toBe(true);
    });

    it('returns null for a non-existent ID', async () => {
      const result = await repository.findPriceListItemById('cltest000000000000none0001', tenantId);

      expect(result).toBeNull();
    });

    it('returns null when ID belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Isolation Tenant' });
      const { id } = await repository.createPriceListItem(
        createPriceListItemInput(),
        otherTenantId,
      );

      const result = await repository.findPriceListItemById(id, tenantId);

      expect(result).toBeNull();
    });

    it('converts Decimal fields to number', async () => {
      const { id } = await repository.createPriceListItem(
        createPriceListItemInput({ costPerUnit: 1.5, multiplier: 3 }),
        tenantId,
      );

      const result = await repository.findPriceListItemById(id, tenantId);

      expect(typeof result!.costPerUnit).toBe('number');
      expect(typeof result!.retailPrice).toBe('number');
    });
  });

  // -- searchPriceListItems --------------------------------------------------

  describe('searchPriceListItems', () => {
    it('returns only items scoped to the tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      await repository.createPriceListItem(
        createPriceListItemInput({ name: 'Red Roses' }),
        tenantId,
      );
      await repository.createPriceListItem(
        createPriceListItemInput({ name: 'Other Item' }),
        otherTenantId,
      );

      const result = await repository.searchPriceListItems({ page: 1, perPage: 20 }, tenantId);

      expect(result.pagination.totalItems).toBe(1);
      expect(result.items[0].name).toBe('Red Roses');
    });

    it('filters by search term', async () => {
      await repository.createPriceListItem(
        createPriceListItemInput({ name: 'Red Roses' }),
        tenantId,
      );
      await repository.createPriceListItem(
        createPriceListItemInput({ name: 'White Lily' }),
        tenantId,
      );

      const result = await repository.searchPriceListItems(
        { search: 'rose', page: 1, perPage: 20 },
        tenantId,
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Red Roses');
    });

    it('filters by category', async () => {
      await repository.createPriceListItem(
        createPriceListItemInput({ name: 'Floral Item', category: 'FLORAL' }),
        tenantId,
      );
      await repository.createPriceListItem(
        createPriceListItemInput({ name: 'Sundry Item', category: 'SUNDRY' }),
        tenantId,
      );

      const result = await repository.searchPriceListItems(
        { category: ['SUNDRY'], page: 1, perPage: 20 },
        tenantId,
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Sundry Item');
    });

    it('paginates correctly', async () => {
      await repository.createPriceListItem(createPriceListItemInput({ name: 'Item A' }), tenantId);
      await repository.createPriceListItem(createPriceListItemInput({ name: 'Item B' }), tenantId);
      await repository.createPriceListItem(createPriceListItemInput({ name: 'Item C' }), tenantId);

      const result = await repository.searchPriceListItems({ page: 1, perPage: 2 }, tenantId);

      expect(result.items).toHaveLength(2);
      expect(result.pagination.totalItems).toBe(3);
      expect(result.pagination.totalPages).toBe(2);
    });
  });

  // -- updatePriceListItem ---------------------------------------------------

  describe('updatePriceListItem', () => {
    it('updates fields and returns updated item', async () => {
      const { id } = await repository.createPriceListItem(
        createPriceListItemInput({ name: 'Old Name', costPerUnit: 1 }),
        tenantId,
      );

      const result = await repository.updatePriceListItem(
        id,
        tenantId,
        createUpdatePriceListItemInput({ id, name: 'New Name', costPerUnit: 1 }),
      );

      expect(result!.name).toBe('New Name');
    });

    it('records cost history when costPerUnit changes', async () => {
      const { id } = await repository.createPriceListItem(
        createPriceListItemInput({ costPerUnit: 1 }),
        tenantId,
      );

      await repository.updatePriceListItem(
        id,
        tenantId,
        createUpdatePriceListItemInput({ id, costPerUnit: 2 }),
      );

      const history = await repository.getPriceListCostHistory(id);
      expect(history).toHaveLength(1);
      expect(history[0].previousCost).toBeCloseTo(1);
      expect(history[0].newCost).toBeCloseTo(2);
    });

    it('does not record cost history when costPerUnit is unchanged', async () => {
      const { id } = await repository.createPriceListItem(
        createPriceListItemInput({ costPerUnit: 1.5 }),
        tenantId,
      );

      await repository.updatePriceListItem(
        id,
        tenantId,
        createUpdatePriceListItemInput({ id, costPerUnit: 1.5 }),
      );

      const history = await repository.getPriceListCostHistory(id);
      expect(history).toHaveLength(0);
    });

    it('returns null when item does not exist', async () => {
      const result = await repository.updatePriceListItem(
        'cltest000000000000none0001',
        tenantId,
        createUpdatePriceListItemInput({ id: 'cltest000000000000none0001' }),
      );

      expect(result).toBeNull();
    });
  });

  // -- deletePriceListItem ---------------------------------------------------

  describe('deletePriceListItem', () => {
    it('soft-deletes an item and returns true', async () => {
      const { id } = await repository.createPriceListItem(createPriceListItemInput(), tenantId);

      const deleted = await repository.deletePriceListItem(id, tenantId);

      expect(deleted).toBe(true);
      const found = await repository.findPriceListItemById(id, tenantId);
      expect(found).toBeNull();
    });

    it('returns false when item does not exist', async () => {
      const result = await repository.deletePriceListItem('cltest000000000000none0001', tenantId);

      expect(result).toBe(false);
    });

    it('returns false when item belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Delete Isolation Tenant' });
      const { id } = await repository.createPriceListItem(
        createPriceListItemInput(),
        otherTenantId,
      );

      const result = await repository.deletePriceListItem(id, tenantId);

      expect(result).toBe(false);
    });
  });

  // -- getPriceListCostHistory -----------------------------------------------

  describe('getPriceListCostHistory', () => {
    it('returns cost history entries ordered by most recent first', async () => {
      const { id } = await repository.createPriceListItem(
        createPriceListItemInput({ costPerUnit: 1 }),
        tenantId,
      );
      await repository.updatePriceListItem(
        id,
        tenantId,
        createUpdatePriceListItemInput({ id, costPerUnit: 2 }),
      );
      await repository.updatePriceListItem(
        id,
        tenantId,
        createUpdatePriceListItemInput({ id, costPerUnit: 3 }),
      );

      const history = await repository.getPriceListCostHistory(id);

      expect(history).toHaveLength(2);
      expect(history[0].newCost).toBeCloseTo(3);
      expect(history[1].newCost).toBeCloseTo(2);
    });

    it('returns empty array when no history exists', async () => {
      const { id } = await repository.createPriceListItem(createPriceListItemInput(), tenantId);

      const history = await repository.getPriceListCostHistory(id);

      expect(history).toHaveLength(0);
    });
  });

  // -- findActivePriceListItems ----------------------------------------------

  describe('findActivePriceListItems', () => {
    it('returns non-deleted items sorted by name', async () => {
      await repository.createPriceListItem(
        createPriceListItemInput({ name: 'Zebra Plant' }),
        tenantId,
      );
      await repository.createPriceListItem(
        createPriceListItemInput({ name: 'Apple Blossom' }),
        tenantId,
      );

      const result = await repository.findActivePriceListItems(tenantId);

      expect(result.length).toBeGreaterThanOrEqual(2);
      const names = result.map((i) => i.name);
      expect(names.indexOf('Apple Blossom')).toBeLessThan(names.indexOf('Zebra Plant'));
    });

    it('excludes soft-deleted items', async () => {
      const { id } = await repository.createPriceListItem(
        createPriceListItemInput({ name: 'Deleted Item' }),
        tenantId,
      );
      await repository.deletePriceListItem(id, tenantId);

      const result = await repository.findActivePriceListItems(tenantId);

      expect(result.find((i) => i.id === id)).toBeUndefined();
    });

    it('returns only items scoped to the tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Active Isolation Tenant' });
      await repository.createPriceListItem(createPriceListItemInput({ name: 'My Item' }), tenantId);
      await repository.createPriceListItem(
        createPriceListItemInput({ name: 'Other Item' }),
        otherTenantId,
      );

      const result = await repository.findActivePriceListItems(tenantId);

      expect(result.every((i) => i.name !== 'Other Item')).toBe(true);
    });
  });
});
