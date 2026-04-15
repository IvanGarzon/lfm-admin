/**
 * OrganizationRepository Integration Tests
 *
 * Tests the repository against a real Postgres database spun up via
 * Testcontainers. No mocks — every assertion hits an actual DB query.
 *
 * Run with: pnpm test:integration
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { OrganizationRepository } from '../organization-repository';
import {
  setupTestDatabaseLifecycle,
  getTestPrisma,
  createTestTenant,
} from '@/lib/testing/integration/database';
import { createOrganizationInput } from '@/lib/testing';

setupTestDatabaseLifecycle();

// -- Tests -------------------------------------------------------------------

describe('OrganizationRepository (integration)', () => {
  let repository: OrganizationRepository;
  let tenantId: string;

  beforeAll(() => {
    repository = new OrganizationRepository(getTestPrisma());
  });

  beforeEach(async () => {
    ({ id: tenantId } = await createTestTenant({ name: 'Organisation Test Tenant' }));
  });

  // -- createOrganization ----------------------------------------------------

  describe('createOrganization', () => {
    it('creates an organisation and returns the record', async () => {
      const result = await repository.createOrganization(createOrganizationInput(), tenantId);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('Acme Florals');
    });
  });

  // -- updateOrganization ----------------------------------------------------

  describe('updateOrganization', () => {
    it('updates fields and returns the updated organisation', async () => {
      const created = await repository.createOrganization(createOrganizationInput(), tenantId);

      const result = await repository.updateOrganization(created.id, tenantId, {
        ...createOrganizationInput(),
        id: created.id,
        name: 'Updated Florals',
      });

      expect(result?.name).toBe('Updated Florals');
    });

    it('does not update an organisation belonging to another tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Update Isolation Tenant' });
      const created = await repository.createOrganization(createOrganizationInput(), otherTenantId);

      await expect(
        repository.updateOrganization(created.id, tenantId, {
          ...createOrganizationInput(),
          id: created.id,
          name: 'Should Not Update',
        }),
      ).rejects.toThrow();
    });
  });

  // -- findOrganizationById --------------------------------------------------

  describe('findOrganizationById', () => {
    it('returns the organisation with customer count', async () => {
      const created = await repository.createOrganization(createOrganizationInput(), tenantId);

      const result = await repository.findOrganizationById(created.id, tenantId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe('Acme Florals');
      expect(result?.customersCount).toBe(0);
    });

    it('returns null for a non-existent ID', async () => {
      const result = await repository.findOrganizationById('cltest000000000000none0001', tenantId);
      expect(result).toBeNull();
    });

    it('returns null when ID belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Isolation Tenant' });
      const created = await repository.createOrganization(createOrganizationInput(), otherTenantId);

      const result = await repository.findOrganizationById(created.id, tenantId);
      expect(result).toBeNull();
    });
  });

  // -- findOrganizationByName ------------------------------------------------

  describe('findOrganizationByName', () => {
    it('finds an organisation by name (case-insensitive)', async () => {
      await repository.createOrganization(createOrganizationInput(), tenantId);

      const result = await repository.findOrganizationByName('acme florals', tenantId);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Acme Florals');
    });

    it('returns null for a name that belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      await repository.createOrganization(createOrganizationInput(), otherTenantId);

      const result = await repository.findOrganizationByName('Acme Florals', tenantId);
      expect(result).toBeNull();
    });
  });

  // -- findOrCreateOrganization ----------------------------------------------

  describe('findOrCreateOrganization', () => {
    it('creates a new organisation when name does not exist', async () => {
      const result = await repository.findOrCreateOrganization('New Org', tenantId);

      expect(result.name).toBe('New Org');
    });

    it('returns the existing organisation when name already exists', async () => {
      const created = await repository.createOrganization(createOrganizationInput(), tenantId);

      const result = await repository.findOrCreateOrganization('Acme Florals', tenantId);

      expect(result.id).toBe(created.id);
    });
  });

  // -- searchOrganizations ---------------------------------------------------

  describe('searchOrganizations', () => {
    it('returns paginated organisations matching the search term', async () => {
      await repository.createOrganization(createOrganizationInput(), tenantId);
      await repository.createOrganization(
        { ...createOrganizationInput(), name: 'Rose Garden' },
        tenantId,
      );

      const result = await repository.searchOrganizations(
        { name: 'Acme', page: 1, perPage: 10 },
        tenantId,
      );

      expect(result.items.some((o) => o.name === 'Acme Florals')).toBe(true);
      expect(result.items.every((o) => o.name !== 'Rose Garden')).toBe(true);
    });

    it('does not return organisations from other tenants', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      await repository.createOrganization(createOrganizationInput(), tenantId);
      await repository.createOrganization(createOrganizationInput(), otherTenantId);

      const result = await repository.searchOrganizations({ page: 1, perPage: 10 }, tenantId);

      expect(result.pagination.totalItems).toBe(1);
    });
  });

  // -- findActiveOrganizations -----------------------------------------------

  describe('findActiveOrganizations', () => {
    it('returns only active organisations for the tenant', async () => {
      await repository.createOrganization(createOrganizationInput(), tenantId);
      await repository.createOrganization(
        { ...createOrganizationInput(), name: 'Inactive Org', status: 'INACTIVE' },
        tenantId,
      );

      const result = await repository.findActiveOrganizations(tenantId);

      expect(result.some((o) => o.name === 'Acme Florals')).toBe(true);
      expect(result.every((o) => o.name !== 'Inactive Org')).toBe(true);
    });
  });

  // -- deleteOrganization ----------------------------------------------------

  describe('deleteOrganization', () => {
    it('permanently removes the organisation', async () => {
      const created = await repository.createOrganization(createOrganizationInput(), tenantId);

      await repository.deleteOrganization(created.id, tenantId);

      const found = await repository.findOrganizationById(created.id, tenantId);
      expect(found).toBeNull();
    });

    it('does not delete an organisation from another tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Delete Isolation Tenant' });
      const created = await repository.createOrganization(createOrganizationInput(), otherTenantId);

      await expect(repository.deleteOrganization(created.id, tenantId)).rejects.toThrow();

      const stillExists = await repository.findOrganizationById(created.id, otherTenantId);
      expect(stillExists).not.toBeNull();
    });
  });
});
