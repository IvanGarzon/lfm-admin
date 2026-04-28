/**
 * UserRepository Integration Tests
 *
 * Tests the repository against a real Postgres database spun up via
 * Testcontainers. No mocks — every assertion hits an actual DB query.
 *
 * Run with: pnpm test:integration
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { UserRepository } from '../user-repository';
import {
  setupTestDatabaseLifecycle,
  getTestPrisma,
  createTestTenant,
} from '@/lib/testing/integration/database';
import { createUserData } from '@/lib/testing';

setupTestDatabaseLifecycle();

describe('UserRepository (integration)', () => {
  let repository: UserRepository;
  let tenantId: string;

  beforeAll(() => {
    repository = new UserRepository(getTestPrisma());
  });

  beforeEach(async () => {
    ({ id: tenantId } = await createTestTenant({ name: 'User Test Tenant' }));
  });

  async function createUser(overrides: Parameters<typeof createUserData>[0] = {}) {
    return getTestPrisma().user.create({
      data: { ...createUserData(overrides), tenantId },
    });
  }

  // -- searchAndPaginateTenantUsers -------------------------------------------------------

  describe('searchAndPaginateTenantUsers', () => {
    it('returns paginated users for a tenant', async () => {
      await createUser({ email: 'a@test.com' });
      await createUser({ email: 'b@test.com' });

      const result = await repository.searchAndPaginateTenantUsers(
        { page: 1, perPage: 10 },
        tenantId,
      );

      expect(result.items.length).toBe(2);
      expect(result.pagination.totalItems).toBe(2);
    });

    it('excludes soft-deleted users', async () => {
      const user = await createUser();
      await getTestPrisma().user.update({
        where: { id: user.id },
        data: { deletedAt: new Date() },
      });

      const result = await repository.searchAndPaginateTenantUsers(
        { page: 1, perPage: 10 },
        tenantId,
      );

      expect(result.items.find((tenantUser) => tenantUser.id === user.id)).toBeUndefined();
    });

    it('filters by search across firstName, lastName, email, phone', async () => {
      await createUser({ firstName: 'Unique', lastName: 'Person', email: 'unique@test.com' });
      await createUser({ email: 'other@test.com' });

      const result = await repository.searchAndPaginateTenantUsers(
        { search: 'Unique', page: 1, perPage: 10 },
        tenantId,
      );

      expect(result.items.length).toBe(1);
      expect(result.items[0].firstName).toBe('Unique');
    });

    it('filters by role', async () => {
      await createUser({ role: 'MANAGER', email: 'mgr@test.com' });
      await createUser({ role: 'USER', email: 'usr@test.com' });

      const result = await repository.searchAndPaginateTenantUsers(
        { role: ['MANAGER'], page: 1, perPage: 10 },
        tenantId,
      );

      expect(result.items.every((u) => u.role === 'MANAGER')).toBe(true);
    });

    it('filters by status', async () => {
      await createUser({ status: 'SUSPENDED', email: 'sus@test.com' });
      await createUser({ status: 'ACTIVE', email: 'act@test.com' });

      const result = await repository.searchAndPaginateTenantUsers(
        { status: ['SUSPENDED'], page: 1, perPage: 10 },
        tenantId,
      );

      expect(result.items.every((tenantUser) => tenantUser.status === 'SUSPENDED')).toBe(true);
    });

    it('does not return users from other tenants', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      await getTestPrisma().user.create({
        data: {
          firstName: 'Other',
          lastName: 'User',
          email: 'other@tenant.com',
          tenantId: otherTenantId,
        },
      });

      const result = await repository.searchAndPaginateTenantUsers(
        { page: 1, perPage: 10 },
        tenantId,
      );

      expect(
        result.items.find((tenantUser) => tenantUser.email === 'other@tenant.com'),
      ).toBeUndefined();
    });
  });

  // -- findTenantUserById ----------------------------------------------------

  describe('findTenantUserById', () => {
    it('returns user by id', async () => {
      const user = await createUser();

      const result = await repository.findTenantUserById(user.id, tenantId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(user.id);
    });

    it('returns null when user not found', async () => {
      const result = await repository.findTenantUserById('nonexistent-id', tenantId);

      expect(result).toBeNull();
    });

    it('returns null for soft-deleted user', async () => {
      const user = await createUser();
      await getTestPrisma().user.update({
        where: { id: user.id },
        data: { deletedAt: new Date() },
      });

      const result = await repository.findTenantUserById(user.id, tenantId);

      expect(result).toBeNull();
    });

    it('does not return user from another tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      const otherUser = await getTestPrisma().user.create({
        data: {
          firstName: 'Other',
          lastName: 'User',
          email: 'other@tenant.com',
          tenantId: otherTenantId,
        },
      });

      const result = await repository.findTenantUserById(otherUser.id, tenantId);

      expect(result).toBeNull();
    });
  });

  // -- updateTenantUser ------------------------------------------------------

  describe('updateTenantUser', () => {
    it('updates user fields and returns updated record', async () => {
      const user = await createUser();

      const result = await repository.updateTenantUser(user.id, tenantId, {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@test.com',
        phone: '0400000000',
        status: 'SUSPENDED',
        isTwoFactorEnabled: true,
      });

      expect(result.firstName).toBe('Updated');
      expect(result.status).toBe('SUSPENDED');
      expect(result.isTwoFactorEnabled).toBe(true);
    });

    it('does not update user from another tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      const otherUser = await getTestPrisma().user.create({
        data: {
          firstName: 'Other',
          lastName: 'User',
          email: 'other@tenant.com',
          tenantId: otherTenantId,
        },
      });

      await expect(
        repository.updateTenantUser(otherUser.id, tenantId, {
          firstName: 'Hacked',
          lastName: 'Name',
          email: 'hacked@test.com',
          status: 'ACTIVE',
          isTwoFactorEnabled: false,
        }),
      ).rejects.toThrow();

      const unchanged = await getTestPrisma().user.findUnique({ where: { id: otherUser.id } });
      expect(unchanged?.firstName).toBe('Other');
    });
  });

  // -- updateUserSecurity ----------------------------------------------------

  describe('updateUserSecurity', () => {
    it('enables two-factor authentication', async () => {
      const user = await createUser();

      const result = await repository.updateUserSecurity(user.id, tenantId, {
        isTwoFactorEnabled: true,
      });

      expect(result.isTwoFactorEnabled).toBe(true);
    });

    it('disables two-factor authentication', async () => {
      const user = await getTestPrisma().user.create({
        data: { ...createUserData(), tenantId, isTwoFactorEnabled: true },
      });

      const result = await repository.updateUserSecurity(user.id, tenantId, {
        isTwoFactorEnabled: false,
      });

      expect(result.isTwoFactorEnabled).toBe(false);
    });

    it('enables login notifications', async () => {
      const user = await createUser();

      const result = await repository.updateUserSecurity(user.id, tenantId, {
        loginNotificationsEnabled: true,
      });

      expect(result.loginNotificationsEnabled).toBe(true);
    });

    it('disables login notifications', async () => {
      const user = await getTestPrisma().user.create({
        data: { ...createUserData(), tenantId, loginNotificationsEnabled: true },
      });

      const result = await repository.updateUserSecurity(user.id, tenantId, {
        loginNotificationsEnabled: false,
      });

      expect(result.loginNotificationsEnabled).toBe(false);
    });

    it('does not update security for user from another tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      const otherUser = await getTestPrisma().user.create({
        data: {
          firstName: 'Other',
          lastName: 'User',
          email: 'other@tenant.com',
          tenantId: otherTenantId,
        },
      });

      await expect(
        repository.updateUserSecurity(otherUser.id, tenantId, { isTwoFactorEnabled: true }),
      ).rejects.toThrow();

      const unchanged = await getTestPrisma().user.findUnique({ where: { id: otherUser.id } });
      expect(unchanged?.isTwoFactorEnabled).toBe(false);
    });
  });

  // -- updateTenantUserRole --------------------------------------------------

  describe('updateTenantUserRole', () => {
    it('updates role only', async () => {
      const user = await createUser({ role: 'USER' });

      await repository.updateTenantUserRole(user.id, tenantId, 'ADMIN');

      const updated = await getTestPrisma().user.findUnique({ where: { id: user.id } });
      expect(updated?.role).toBe('ADMIN');
    });

    it('throws when user not found', async () => {
      await expect(
        repository.updateTenantUserRole('nonexistent-id', tenantId, 'ADMIN'),
      ).rejects.toThrow();
    });

    it('does not update role for user from another tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      const otherUser = await getTestPrisma().user.create({
        data: {
          firstName: 'Other',
          lastName: 'User',
          email: 'other@tenant.com',
          role: 'USER',
          tenantId: otherTenantId,
        },
      });

      await expect(
        repository.updateTenantUserRole(otherUser.id, tenantId, 'ADMIN'),
      ).rejects.toThrow();

      const unchanged = await getTestPrisma().user.findUnique({ where: { id: otherUser.id } });
      expect(unchanged?.role).toBe('USER');
    });
  });

  // -- updateUserAvatar ------------------------------------------------------

  describe('updateUserAvatar', () => {
    it('updates avatarUrl for the user', async () => {
      const user = await createUser();
      const avatarUrl = 'https://bucket.s3.region.amazonaws.com/users/avatar.jpg';

      await repository.updateUserAvatar(user.id, tenantId, avatarUrl);

      const updated = await getTestPrisma().user.findUnique({ where: { id: user.id } });
      expect(updated?.avatarUrl).toBe(avatarUrl);
    });

    it('does not update user from another tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      const otherUser = await getTestPrisma().user.create({
        data: {
          firstName: 'Other',
          lastName: 'User',
          email: 'other@tenant.com',
          tenantId: otherTenantId,
        },
      });

      await expect(
        repository.updateUserAvatar(otherUser.id, tenantId, 'https://fake.com/avatar.jpg'),
      ).rejects.toThrow();

      const unchanged = await getTestPrisma().user.findUnique({ where: { id: otherUser.id } });
      expect(unchanged?.avatarUrl).toBeNull();
    });
  });

  // -- softDeleteTenantUser --------------------------------------------------

  describe('softDeleteTenantUser', () => {
    it('sets deletedAt and returns true', async () => {
      const user = await createUser();

      const result = await repository.softDeleteTenantUser(user.id, tenantId);

      expect(result).toBe(true);
      const updated = await getTestPrisma().user.findUnique({ where: { id: user.id } });
      expect(updated?.deletedAt).not.toBeNull();
    });

    it('returns false when user not found', async () => {
      const result = await repository.softDeleteTenantUser('nonexistent-id', tenantId);

      expect(result).toBe(false);
    });

    it('does not delete user from another tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      const otherUser = await getTestPrisma().user.create({
        data: {
          firstName: 'Other',
          lastName: 'User',
          email: 'other@tenant.com',
          tenantId: otherTenantId,
        },
      });

      const result = await repository.softDeleteTenantUser(otherUser.id, tenantId);

      expect(result).toBe(false);
    });
  });
});
