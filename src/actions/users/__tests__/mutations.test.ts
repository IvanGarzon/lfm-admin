import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateUser, updateUserRole, softDeleteUser } from '../mutations';
import { testIds, mockSessions, createUpdateUserInput } from '@/lib/testing';
import { revalidatePath } from 'next/cache';
import type { UserDetail } from '@/features/users/types';

const { mockUserRepo, mockAuth } = vi.hoisted(() => ({
  mockUserRepo: {
    findTenantUserById: vi.fn(),
    updateTenantUser: vi.fn(),
    updateTenantUserRole: vi.fn(),
    softDeleteTenantUser: vi.fn(),
  },
  mockAuth: vi.fn(),
}));

vi.mock('@/repositories/user-repository', () => ({
  UserRepository: vi.fn().mockImplementation(function () {
    return mockUserRepo;
  }),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const TEST_USER_ID = testIds.user();

const mockUser: UserDetail = {
  id: TEST_USER_ID,
  firstName: 'Alex',
  lastName: 'Taylor',
  email: 'alex@example.com',
  phone: null,
  role: 'USER',
  status: 'ACTIVE',
  isTwoFactorEnabled: false,
  lastLoginAt: null,
  addedBy: null,
};

const baseInput = createUpdateUserInput({ id: TEST_USER_ID });

describe('User Mutations', () => {
  const mockSession = mockSessions.admin();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
    mockUserRepo.findTenantUserById.mockResolvedValue(mockUser);
  });

  describe('updateUser', () => {
    it('updates user and returns the record', async () => {
      mockUserRepo.updateTenantUser.mockResolvedValue(mockUser);

      const result = await updateUser(baseInput);

      expect(result.success).toBe(true);
      expect(mockUserRepo.updateTenantUser).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/users');
      expect(revalidatePath).toHaveBeenCalledWith(`/users/${TEST_USER_ID}`);
    });

    it('returns error when user not found', async () => {
      mockUserRepo.findTenantUserById.mockResolvedValue(null);

      const result = await updateUser(baseInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/not found/i);
      }
      expect(mockUserRepo.updateTenantUser).not.toHaveBeenCalled();
    });

    it('returns error when unauthenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await updateUser(baseInput);

      expect(result.success).toBe(false);
    });
  });

  describe('updateUserRole', () => {
    it('updates role and returns the user', async () => {
      mockUserRepo.updateTenantUserRole.mockResolvedValue({ ...mockUser, role: 'ADMIN' });

      const result = await updateUserRole({ id: TEST_USER_ID, role: 'ADMIN' });

      expect(result.success).toBe(true);
      expect(mockUserRepo.updateTenantUserRole).toHaveBeenCalledWith(
        TEST_USER_ID,
        mockSession.user.tenantId,
        'ADMIN',
      );
    });

    it('returns error when user not found', async () => {
      mockUserRepo.findTenantUserById.mockResolvedValue(null);

      const result = await updateUserRole({ id: TEST_USER_ID, role: 'ADMIN' });

      expect(result.success).toBe(false);
    });
  });

  describe('softDeleteUser', () => {
    it('soft-deletes user and returns the id', async () => {
      mockUserRepo.softDeleteTenantUser.mockResolvedValue(true);

      const result = await softDeleteUser({ id: TEST_USER_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_USER_ID);
      }
      expect(revalidatePath).toHaveBeenCalledWith('/users');
    });

    it('returns error when user not found', async () => {
      mockUserRepo.softDeleteTenantUser.mockResolvedValue(false);

      const result = await softDeleteUser({ id: TEST_USER_ID });

      expect(result.success).toBe(false);
    });
  });
});
