/**
 * VendorRepository Integration Tests
 *
 * Tests the repository against a real Postgres database spun up via
 * Testcontainers. No mocks — every assertion hits an actual DB query.
 *
 * Run with: pnpm test:integration
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { VendorRepository } from '../vendor-repository';
import {
  setupTestDatabaseLifecycle,
  getTestPrisma,
  createTestTenant,
} from '@/lib/testing/integration/database';
import { createVendorInput } from '@/lib/testing';

setupTestDatabaseLifecycle();

// -- Shared fixture ----------------------------------------------------------

const vendorInput = createVendorInput();

// -- Tests -------------------------------------------------------------------

describe('VendorRepository (integration)', () => {
  let repository: VendorRepository;
  let tenantId: string;

  beforeAll(() => {
    repository = new VendorRepository(getTestPrisma());
  });

  beforeEach(async () => {
    ({ id: tenantId } = await createTestTenant({ name: 'Vendor Test Tenant' }));
  });

  describe('createVendor', () => {
    it('creates a vendor and returns its ID and code', async () => {
      const result = await repository.createVendor(vendorInput, tenantId);

      expect(result.id).toBeDefined();
      expect(result.vendorCode).toMatch(/^VEN-\d{4}-\d{4}$/);
    });

    it('auto-generates unique vendor codes', async () => {
      const [a, b] = await Promise.all([
        repository.createVendor(vendorInput, tenantId),
        repository.createVendor(vendorInput, tenantId),
      ]);

      expect(a.vendorCode).not.toBe(b.vendorCode);
    });
  });

  describe('findByIdWithDetails', () => {
    it('returns a vendor with details when found', async () => {
      const created = await repository.createVendor(vendorInput, tenantId);
      const result = await repository.findByIdWithDetails(created.id, tenantId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(vendorInput.name);
    });

    it('returns null for a non-existent ID', async () => {
      const result = await repository.findByIdWithDetails('cltest000000000000none0001', tenantId);
      expect(result).toBeNull();
    });

    it('returns null when ID belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      const created = await repository.createVendor(vendorInput, otherTenantId);

      const result = await repository.findByIdWithDetails(created.id, tenantId);
      expect(result).toBeNull();
    });
  });

  describe('searchAndPaginate', () => {
    it('returns paginated vendors for the tenant', async () => {
      await repository.createVendor(vendorInput, tenantId);

      const result = await repository.searchAndPaginate({ page: 1, perPage: 10 }, tenantId);

      expect(result.items.length).toBeGreaterThanOrEqual(1);
      expect(result.pagination.totalItems).toBeGreaterThanOrEqual(1);
    });

    it('does not return vendors from other tenants', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      await repository.createVendor(vendorInput, otherTenantId);
      await repository.createVendor(vendorInput, tenantId);

      const result = await repository.searchAndPaginate({ page: 1, perPage: 10 }, tenantId);

      expect(result.pagination.totalItems).toBe(1);
    });

    it('filters by search term across name and email', async () => {
      await repository.createVendor({ ...vendorInput, name: 'Unique Botanicals' }, tenantId);
      await repository.createVendor(
        { ...vendorInput, name: 'Standard Supplies', email: 'standard@supply.com' },
        tenantId,
      );

      const result = await repository.searchAndPaginate(
        { page: 1, perPage: 10, search: 'Botanicals' },
        tenantId,
      );

      expect(result.items.every((v) => v.name === 'Unique Botanicals')).toBe(true);
    });

    it('filters by status', async () => {
      await repository.createVendor({ ...vendorInput, status: 'ACTIVE' }, tenantId);
      await repository.createVendor({ ...vendorInput, status: 'INACTIVE' }, tenantId);

      const result = await repository.searchAndPaginate(
        { page: 1, perPage: 10, status: ['ACTIVE'] },
        tenantId,
      );

      expect(result.items.every((v) => v.status === 'ACTIVE')).toBe(true);
    });
  });

  describe('updateVendor', () => {
    it('updates fields and returns the updated record', async () => {
      const created = await repository.createVendor(vendorInput, tenantId);
      const result = await repository.updateVendor(created.id, tenantId, {
        ...vendorInput,
        id: created.id,
        name: 'Updated Vendor Name',
      });

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Updated Vendor Name');
    });

    it('returns null when ID belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      const created = await repository.createVendor(vendorInput, otherTenantId);

      const result = await repository.updateVendor(created.id, tenantId, {
        ...vendorInput,
        id: created.id,
      });
      expect(result).toBeNull();
    });
  });

  describe('updateVendorStatus', () => {
    it('updates the vendor status', async () => {
      const created = await repository.createVendor(vendorInput, tenantId);
      const result = await repository.updateVendorStatus(created.id, tenantId, 'INACTIVE');

      expect(result.status).toBe('INACTIVE');
    });

    it('throws when ID belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      const created = await repository.createVendor(vendorInput, otherTenantId);

      await expect(
        repository.updateVendorStatus(created.id, tenantId, 'INACTIVE'),
      ).rejects.toThrow();
    });
  });

  describe('softDeleteVendor', () => {
    it('soft deletes the vendor', async () => {
      const created = await repository.createVendor(vendorInput, tenantId);
      await repository.softDeleteVendor(created.id, tenantId);

      const gone = await repository.findByIdWithDetails(created.id, tenantId);
      expect(gone).toBeNull();
    });

    it('throws when ID belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      const created = await repository.createVendor(vendorInput, otherTenantId);

      await expect(repository.softDeleteVendor(created.id, tenantId)).rejects.toThrow();
    });
  });

  describe('getStatistics', () => {
    it('returns correct counts by status', async () => {
      await repository.createVendor({ ...vendorInput, status: 'ACTIVE' }, tenantId);
      await repository.createVendor({ ...vendorInput, status: 'ACTIVE' }, tenantId);
      await repository.createVendor({ ...vendorInput, status: 'INACTIVE' }, tenantId);

      const stats = await repository.getStatistics(tenantId);

      expect(stats.active).toBeGreaterThanOrEqual(2);
      expect(stats.inactive).toBeGreaterThanOrEqual(1);
      expect(stats.total).toBe(stats.active + stats.inactive + stats.suspended);
    });

    it('does not count vendors from other tenants', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      await repository.createVendor(vendorInput, otherTenantId);

      const stats = await repository.getStatistics(tenantId);
      expect(stats.total).toBe(0);
    });
  });

  describe('getActiveVendors', () => {
    it('returns only active vendors for the tenant', async () => {
      await repository.createVendor({ ...vendorInput, status: 'ACTIVE' }, tenantId);
      await repository.createVendor({ ...vendorInput, status: 'INACTIVE' }, tenantId);

      const result = await repository.getActiveVendors(tenantId);

      expect(result.every((v) => v.id)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('does not return vendors from other tenants', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      await repository.createVendor(vendorInput, otherTenantId);

      const result = await repository.getActiveVendors(tenantId);
      expect(result).toHaveLength(0);
    });
  });
});
