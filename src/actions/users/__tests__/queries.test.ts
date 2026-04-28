import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTenantUsers, getTenantUserById } from '../queries';
import { testIds, mockSessions } from '@/lib/testing';
import type { UserPagination, UserDetail } from '@/features/users/types';

const { mockUserRepo, mockAuth } = vi.hoisted(() => ({
  mockUserRepo: {
    searchAndPaginateTenantUsers: vi.fn(),
    findTenantUserById: vi.fn(),
  },
  mockAuth: vi.fn(),
}));

vi.mock('@/repositories/user-repository', () => ({
  UserRepository: vi.fn().mockImplementation(function () {
    return mockUserRepo;
  }),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));

vi.mock('@/filters/users/users-filters', () => ({
  searchParamsCache: {
    parse: vi.fn().mockReturnValue({ page: 1, perPage: 20 }),
  },
}));

const TEST_USER_ID = testIds.user();

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
      addedBy: null,
    },
  ],
  pagination: {
    totalItems: 1,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    nextPage: null,
    previousPage: null,
  },
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
  addedBy: null,
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

      const result = await getTenantUsers({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(1);
      }
    });

    it('returns error when unauthenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getTenantUsers({});

      expect(result.success).toBe(false);
    });

    it('returns error when user lacks canManageUsers permission', async () => {
      mockAuth.mockResolvedValue(mockSessions.user());

      const result = await getTenantUsers({});

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
});
