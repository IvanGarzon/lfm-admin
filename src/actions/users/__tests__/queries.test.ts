import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getTenantUsers,
  getTenantUserById,
  getPasswordResetToken,
  getUserRoleChanges
} from '../queries';
import { testIds } from '@/lib/testing/id-generator';
import { mockSessions } from '@/lib/testing/factories/session.factory';
import type { UserPagination, UserDetail, UserFilters } from '@/features/users/types';

const { mockUserRepo, mockPasswordResetTokenRepo, mockAuditService, mockAuth } = vi.hoisted(() => ({
  mockUserRepo: {
    searchAndPaginateTenantUsers: vi.fn(),
    findTenantUserById: vi.fn(),
    getUserByIdWithSelect: vi.fn()
  },
  mockPasswordResetTokenRepo: {
    findValid: vi.fn()
  },
  mockAuditService: {
    findRoleChangesForUser: vi.fn()
  },
  mockAuth: vi.fn()
}));

vi.mock('@/repositories/user-repository', () => ({
  UserRepository: vi.fn().mockImplementation(function () {
    return mockUserRepo;
  })
}));

vi.mock('@/repositories/password-reset-token-repository', () => ({
  PasswordResetTokenRepository: vi.fn().mockImplementation(function () {
    return mockPasswordResetTokenRepo;
  })
}));

vi.mock('@/services/audit.service', () => ({
  AuditService: vi.fn().mockImplementation(function () {
    return mockAuditService;
  })
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));

const TEST_USER_ID = testIds.user();
const DEFAULT_FILTERS: UserFilters = { page: 1, perPage: 20 };

const mockPagination: UserPagination = {
  items: [
    {
      id: TEST_USER_ID,
      firstName: 'Alex',
      lastName: 'Taylor',
      email: 'alex@example.com',
      phone: null,
      role: 'USER',
      status: 'ACTIVE',
      lastLoginAt: null,
      avatarUrl: null,
      addedBy: null
    }
  ],
  pagination: {
    totalItems: 1,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    nextPage: null,
    previousPage: null
  }
};

const mockUser: UserDetail = {
  id: TEST_USER_ID,
  firstName: 'Alex',
  lastName: 'Taylor',
  email: 'alex@example.com',
  phone: null,
  role: 'USER',
  status: 'ACTIVE',
  isTwoFactorEnabled: false,
  loginNotificationsEnabled: false,
  lastLoginAt: null,
  username: null,
  title: null,
  bio: null,
  avatarUrl: null,
  addedBy: null
};

describe('User Queries', () => {
  const mockSession = mockSessions.admin();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
  });

  describe('getTenantUsers', () => {
    it('returns paginated users', async () => {
      mockUserRepo.searchAndPaginateTenantUsers.mockResolvedValue(mockPagination);

      const result = await getTenantUsers(DEFAULT_FILTERS);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(1);
      }
      expect(mockUserRepo.searchAndPaginateTenantUsers).toHaveBeenCalledWith(
        DEFAULT_FILTERS,
        mockSession.user.tenantId
      );
    });

    it('returns error when unauthenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getTenantUsers(DEFAULT_FILTERS);

      expect(result.success).toBe(false);
    });

    it('returns error when user lacks canManageUsers permission', async () => {
      mockAuth.mockResolvedValue(mockSessions.user());

      const result = await getTenantUsers(DEFAULT_FILTERS);

      expect(result.success).toBe(false);
    });
  });

  describe('getTenantUserById', () => {
    it('returns user by id', async () => {
      mockUserRepo.findTenantUserById.mockResolvedValue(mockUser);

      const result = await getTenantUserById(TEST_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_USER_ID);
      }
    });

    it('returns error when user not found', async () => {
      mockUserRepo.findTenantUserById.mockResolvedValue(null);

      const result = await getTenantUserById('nonexistent-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/not found/i);
      }
    });
  });

  describe('getPasswordResetToken', () => {
    const mockTokenRecord = { id: 'pt-1', userId: TEST_USER_ID };

    beforeEach(() => {
      mockPasswordResetTokenRepo.findValid.mockResolvedValue(mockTokenRecord);
      mockUserRepo.getUserByIdWithSelect.mockResolvedValue({ email: 'alex@example.com' });
    });

    it('returns email when token is valid', async () => {
      const result = await getPasswordResetToken('valid-token');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.email).toBe('alex@example.com');
      }
    });

    it('returns error when token is invalid or expired', async () => {
      mockPasswordResetTokenRepo.findValid.mockResolvedValue(null);

      const result = await getPasswordResetToken('expired-token');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/invalid or has expired/i);
      }
    });

    it('returns error when linked user has no email', async () => {
      mockUserRepo.getUserByIdWithSelect.mockResolvedValue({ email: null });

      const result = await getPasswordResetToken('valid-token');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/user not found/i);
      }
    });

    it('returns error when linked user record is null', async () => {
      mockUserRepo.getUserByIdWithSelect.mockResolvedValue(null);

      const result = await getPasswordResetToken('valid-token');

      expect(result.success).toBe(false);
    });
  });

  describe('getUserRoleChanges', () => {
    const mockChanges = [
      {
        id: 'ac-1',
        userId: TEST_USER_ID,
        fromRole: 'USER',
        toRole: 'ADMIN',
        changedByName: 'Jane Admin',
        changedAt: new Date('2024-01-15')
      }
    ];

    beforeEach(() => {
      mockAuditService.findRoleChangesForUser.mockResolvedValue(mockChanges);
    });

    it('returns role change history for a user', async () => {
      const result = await getUserRoleChanges(TEST_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].toRole).toBe('ADMIN');
      }
      expect(mockAuditService.findRoleChangesForUser).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it('returns empty array when user has no role changes', async () => {
      mockAuditService.findRoleChangesForUser.mockResolvedValue([]);

      const result = await getUserRoleChanges(TEST_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it('returns error when unauthenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getUserRoleChanges(TEST_USER_ID);

      expect(result.success).toBe(false);
    });

    it('returns error when user lacks canManageUsers permission', async () => {
      mockAuth.mockResolvedValue(mockSessions.user());

      const result = await getUserRoleChanges(TEST_USER_ID);

      expect(result.success).toBe(false);
    });
  });
});
