import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateUser, updateUserRole, softDeleteUser, inviteUser } from '../mutations';
import { testIds, mockSessions, createUpdateUserInput } from '@/lib/testing';
import { revalidatePath } from 'next/cache';
import { sendEmailNotification } from '@/lib/email-service';
import type { UserDetail } from '@/features/users/types';

const { mockUserRepo, mockInvitationRepo, mockTenantRepo, mockAuth } = vi.hoisted(() => ({
  mockUserRepo: {
    findTenantUserById: vi.fn(),
    updateTenantUser: vi.fn(),
    updateTenantUserRole: vi.fn(),
    softDeleteTenantUser: vi.fn(),
    getUserByEmail: vi.fn(),
    findById: vi.fn(),
  },
  mockInvitationRepo: {
    findPendingByEmail: vi.fn(),
    create: vi.fn(),
    revoke: vi.fn(),
  },
  mockTenantRepo: {
    findTenantById: vi.fn(),
  },
  mockAuth: vi.fn(),
}));

vi.mock('@/repositories/user-repository', () => ({
  UserRepository: vi.fn().mockImplementation(function () {
    return mockUserRepo;
  }),
}));

vi.mock('@/repositories/invitation-repository', () => ({
  InvitationRepository: vi.fn().mockImplementation(function () {
    return mockInvitationRepo;
  }),
}));

vi.mock('@/repositories/tenant-repository', () => ({
  TenantRepository: vi.fn().mockImplementation(function () {
    return mockTenantRepo;
  }),
}));

vi.mock('@/lib/email-service', () => ({
  sendEmailNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/utils', () => ({
  absoluteUrl: vi.fn((path: string) => `https://example.com${path}`),
  getPaginationMetadata: vi.fn(),
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

  describe('inviteUser', () => {
    const mockInvitation = {
      id: 'inv-1',
      token: 'test-token-abc',
      role: 'USER' as const,
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
    };

    const mockTenant = { id: 'tenant-1', name: 'Test Tenant' };
    const mockInviter = { id: 'user-1', firstName: 'Jane', lastName: 'Admin' };

    beforeEach(() => {
      mockInvitationRepo.findPendingByEmail.mockResolvedValue(null);
      mockInvitationRepo.create.mockResolvedValue(mockInvitation);
      mockTenantRepo.findTenantById.mockResolvedValue(mockTenant);
      mockUserRepo.findById.mockResolvedValue(mockInviter);
      mockUserRepo.getUserByEmail.mockResolvedValue(null);
    });

    it('sends invitation and returns success', async () => {
      const result = await inviteUser({ email: 'new@example.com', role: 'USER' });

      expect(result.success).toBe(true);
      expect(mockInvitationRepo.create).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/users');
    });

    it('returns error when pending invitation already exists', async () => {
      mockInvitationRepo.findPendingByEmail.mockResolvedValue(mockInvitation);

      const result = await inviteUser({ email: 'existing@example.com', role: 'USER' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/already pending/i);
      }
      expect(mockInvitationRepo.create).not.toHaveBeenCalled();
    });

    it('returns error when user with email already exists in tenant', async () => {
      mockUserRepo.getUserByEmail.mockResolvedValue({
        id: 'u-1',
        tenantId: mockSession.user.tenantId,
      });

      const result = await inviteUser({ email: 'existing@example.com', role: 'USER' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/already exists/i);
      }
    });

    it('revokes invitation and returns error when email send fails', async () => {
      vi.mocked(sendEmailNotification).mockRejectedValueOnce(new Error('SMTP error'));

      const result = await inviteUser({ email: 'new@example.com', role: 'USER' });

      expect(result.success).toBe(false);
      expect(mockInvitationRepo.create).toHaveBeenCalled();
      expect(mockInvitationRepo.revoke).toHaveBeenCalledWith(mockInvitation.id);
    });

    it('returns error when unauthenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await inviteUser({ email: 'new@example.com', role: 'USER' });

      expect(result.success).toBe(false);
    });
  });
});
