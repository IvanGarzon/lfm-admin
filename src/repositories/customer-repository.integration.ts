/**
 * CustomerRepository Integration Tests
 *
 * Tests the repository against a real Postgres database spun up via
 * Testcontainers. No mocks — every assertion hits an actual DB query.
 *
 * Run with: pnpm test:integration
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { CustomerRepository } from './customer-repository';
import {
  setupTestDatabaseLifecycle,
  getTestPrisma,
  createTestTenant,
} from '@/lib/testing/integration/database';
import { createCustomerInput } from '@/lib/testing';

setupTestDatabaseLifecycle();

// -- Shared fixture ----------------------------------------------------------

const customerInput = createCustomerInput;

// -- Tests -------------------------------------------------------------------

describe('CustomerRepository (integration)', () => {
  let repository: CustomerRepository;
  let tenantId: string;

  beforeAll(() => {
    repository = new CustomerRepository(getTestPrisma());
  });

  beforeEach(async () => {
    ({ id: tenantId } = await createTestTenant({ name: 'Customer Test Tenant' }));
  });

  describe('createCustomer', () => {
    it('creates a customer and returns the record', async () => {
      const result = await repository.createCustomer(customerInput, tenantId);

      expect(result.id).toBeDefined();
      expect(result.firstName).toBe('Jane');
      expect(result.email).toBe('jane@example.com');
    });

    it('stores address fields when useOrganizationAddress is false', async () => {
      const result = await repository.createCustomer(
        { ...customerInput, useOrganizationAddress: false },
        tenantId,
      );

      expect(result.address1).toBe('1 Test St');
      expect(result.city).toBe('Melbourne');
    });

    it('omits address fields when useOrganizationAddress is true', async () => {
      const result = await repository.createCustomer(
        { ...customerInput, useOrganizationAddress: true },
        tenantId,
      );

      expect(result.address1).toBeNull();
      expect(result.city).toBeNull();
    });

    it('links to an organisation when organizationId is provided', async () => {
      const org = await getTestPrisma().organization.create({
        data: { name: 'Acme', tenantId },
      });

      const result = await repository.createCustomer(
        { ...customerInput, organizationId: org.id },
        tenantId,
      );

      expect(result.organizationId).toBe(org.id);
    });

    it('always creates with ACTIVE status regardless of input', async () => {
      const result = await repository.createCustomer(
        { ...customerInput, status: 'INACTIVE' },
        tenantId,
      );

      expect(result.status).toBe('ACTIVE');
    });
  });

  describe('updateCustomer', () => {
    it('updates a customer and returns the record', async () => {
      const created = await repository.createCustomer(customerInput, tenantId);
      const result = await repository.updateCustomer(created.id, tenantId, {
        ...customerInput,
        id: created.id,
        phone: '+1234567890',
      });

      expect(result).not.toBeNull();
      expect(result?.phone).toBe('+1234567890');
    });

    it('returns null for a non-existent ID', async () => {
      const nonExistentId = 'cltest000000000000none0001';
      const result = await repository.updateCustomer(nonExistentId, tenantId, {
        ...customerInput,
        id: nonExistentId,
      });

      expect(result).toBeNull();
    });

    it('returns null when ID belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      const created = await repository.createCustomer(customerInput, otherTenantId);

      const result = await repository.updateCustomer(created.id, tenantId, {
        ...customerInput,
        id: created.id,
        phone: '+1234567890',
      });

      expect(result).toBeNull();
    });
  });

  describe('findCustomerByEmail', () => {
    it('finds an existing customer by email within the tenant', async () => {
      await repository.createCustomer(customerInput, tenantId);

      const result = await repository.findCustomerByEmail('jane@example.com', tenantId);

      expect(result).not.toBeNull();
      expect(result?.email).toBe('jane@example.com');
    });

    it('returns null for an email that belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      await repository.createCustomer(customerInput, otherTenantId);

      const result = await repository.findCustomerByEmail('jane@example.com', tenantId);

      expect(result).toBeNull();
    });

    it('returns null for an email that does not exist', async () => {
      const result = await repository.findCustomerByEmail('nobody@example.com', tenantId);
      expect(result).toBeNull();
    });
  });

  describe('findCustomerById', () => {
    it('returns a customer with details when found', async () => {
      const created = await repository.createCustomer(customerInput, tenantId);
      const result = await repository.findCustomerById(created.id, tenantId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.firstName).toBe('Jane');
      expect(result?.invoicesCount).toBe(0);
      expect(result?.quotesCount).toBe(0);
    });

    it('returns null for a non-existent ID', async () => {
      const result = await repository.findCustomerById('cltest000000000000none0001', tenantId);
      expect(result).toBeNull();
    });

    it('returns null when ID belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Isolation Tenant' });
      const created = await repository.createCustomer(customerInput, otherTenantId);

      const result = await repository.findCustomerById(created.id, tenantId);
      expect(result).toBeNull();
    });
  });

  describe('searchCustomers', () => {
    it('returns paginated customers matching the search term', async () => {
      await repository.createCustomer(customerInput, tenantId);
      await repository.createCustomer(
        { ...customerInput, firstName: 'Bob', email: 'bob@example.com' },
        tenantId,
      );

      const result = await repository.searchCustomers(
        { search: 'Jane', page: 1, perPage: 10 },
        tenantId,
      );

      expect(result.items.some((c) => c.firstName === 'Jane')).toBe(true);
      expect(result.items.every((c) => c.firstName !== 'Bob')).toBe(true);
    });

    it('does not return customers from other tenants', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      await repository.createCustomer(customerInput, tenantId);
      await repository.createCustomer(customerInput, otherTenantId);

      const result = await repository.searchCustomers({ page: 1, perPage: 10 }, tenantId);

      expect(result.pagination.totalItems).toBe(1);
    });

    it('returns correct pagination metadata', async () => {
      for (let i = 0; i < 3; i++) {
        await repository.createCustomer(
          { ...customerInput, email: `customer${i}@example.com` },
          tenantId,
        );
      }

      const result = await repository.searchCustomers({ page: 1, perPage: 2 }, tenantId);

      expect(result.items.length).toBeLessThanOrEqual(2);
      expect(result.pagination.totalItems).toBeGreaterThanOrEqual(3);
    });
  });

  describe('findActiveCustomers', () => {
    it('returns only active customers for the tenant', async () => {
      const created = await repository.createCustomer(customerInput, tenantId);
      await repository.softDeleteCustomer(created.id, tenantId);
      await repository.createCustomer({ ...customerInput, email: 'active@example.com' }, tenantId);

      const result = await repository.findActiveCustomers(tenantId);

      expect(result.some((c) => c.email === 'active@example.com')).toBe(true);
      expect(result.every((c) => c.email !== 'jane@example.com')).toBe(true);
    });
  });

  describe('softDeleteCustomer', () => {
    it('sets deletedAt and excludes the customer from search results', async () => {
      const created = await repository.createCustomer(customerInput, tenantId);

      await repository.softDeleteCustomer(created.id, tenantId);

      const found = await repository.findCustomerById(created.id, tenantId);
      expect(found?.deletedAt).not.toBeNull();

      const search = await repository.searchCustomers({ page: 1, perPage: 100 }, tenantId);
      expect(search.items.some((c) => c.id === created.id)).toBe(false);
    });

    it('does not soft-delete a customer from another tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Delete Isolation Tenant' });
      const created = await repository.createCustomer(customerInput, otherTenantId);

      await expect(repository.softDeleteCustomer(created.id, tenantId)).rejects.toThrow();

      const stillExists = await repository.findCustomerById(created.id, otherTenantId);
      expect(stillExists).not.toBeNull();
    });
  });
});
