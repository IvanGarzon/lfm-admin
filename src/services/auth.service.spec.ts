import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleSignIn } from '@/services/auth.service';
import { testIds } from '@/lib/testing';

const { mockUserRepo, mockAuditService, mockLogger, mockPrisma } = vi.hoisted(() => ({
  mockUserRepo: {
    getUserByEmail: vi.fn(),
  },
  mockAuditService: {
    LoggedIn: vi.fn(),
  },
  mockLogger: {
    error: vi.fn(),
  },
  mockPrisma: {
    account: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    user: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/repositories/user-repository', () => {
  return {
    UserRepository: vi.fn().mockImplementation(function () {
      return mockUserRepo;
    }),
  };
});

vi.mock('@/services/audit.service', () => {
  return {
    AuditService: vi.fn().mockImplementation(function () {
      return mockAuditService;
    }),
  };
});

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

// Test data factories
const TEST_USER_ID = testIds.user();

function createMockUser(
  overrides: Partial<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    emailVerified: Date | null;
    avatarUrl: string | null;
    password: string | null;
  }> = {},
) {
  return {
    id: overrides.id ?? TEST_USER_ID,
    email: overrides.email ?? 'test@example.com',
    firstName: overrides.firstName ?? 'John',
    lastName: overrides.lastName ?? 'Doe',
    emailVerified: overrides.emailVerified ?? null,
    avatarUrl: overrides.avatarUrl ?? null,
    password: overrides.password ?? null,
    ...overrides,
  };
}

function createMockAccount(
  overrides: Partial<{
    provider: string;
    providerAccountId: string;
    type: string;
  }> = {},
) {
  return {
    provider: overrides.provider ?? 'google',
    providerAccountId: overrides.providerAccountId ?? 'provider-123',
    type: overrides.type ?? 'oauth',
    ...overrides,
  };
}

function createMockProfile(
  overrides: Partial<{
    email: string;
    given_name: string;
    family_name: string;
    picture: string;
  }> = {},
) {
  return {
    email: overrides.email ?? 'test@example.com',
    given_name: overrides.given_name ?? 'John',
    family_name: overrides.family_name ?? 'Doe',
    picture: overrides.picture ?? 'https://example.com/avatar.jpg',
    ...overrides,
  };
}

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleSignIn', () => {
    describe('validation', () => {
      it('returns false when account is null', async () => {
        const result = await handleSignIn({ account: null });

        expect(result).toBe(false);
      });

      it('returns false when email is missing in profile', async () => {
        const result = await handleSignIn({
          account: createMockAccount() as any,
          profile: { given_name: 'No', family_name: 'Email' } as any,
        });

        expect(result).toBe(false);
      });

      it('returns false when email is empty string', async () => {
        const result = await handleSignIn({
          account: createMockAccount() as any,
          profile: createMockProfile({ email: '' }) as any,
        });

        expect(result).toBe(false);
      });
    });

    describe('existing account sign-in', () => {
      it('allows sign-in and logs when account already exists', async () => {
        const existingAccount = { userId: TEST_USER_ID };
        mockPrisma.account.findUnique.mockResolvedValue(existingAccount);

        const result = await handleSignIn({
          account: createMockAccount() as any,
          profile: createMockProfile() as any,
        });

        expect(result).toBe(true);
        expect(mockAuditService.LoggedIn).toHaveBeenCalledWith({
          data: { userId: TEST_USER_ID },
        });
        expect(mockPrisma.account.create).not.toHaveBeenCalled();
      });
    });

    describe('existing user without account', () => {
      it('creates account for existing user and allows sign-in', async () => {
        const existingUser = createMockUser();
        mockPrisma.account.findUnique.mockResolvedValue(null);
        mockUserRepo.getUserByEmail.mockResolvedValue(existingUser);
        mockPrisma.account.create.mockResolvedValue({});

        const result = await handleSignIn({
          account: createMockAccount() as any,
          profile: createMockProfile({ email: existingUser.email }) as any,
        });

        expect(result).toBe(true);
        expect(mockPrisma.account.create).toHaveBeenCalled();
        expect(mockAuditService.LoggedIn).toHaveBeenCalledWith({
          data: { userId: existingUser.id },
        });
      });
    });

    describe('new user sign-in', () => {
      it('creates new user and account when user does not exist', async () => {
        const newUser = createMockUser({ email: 'newuser@example.com' });
        mockPrisma.account.findUnique.mockResolvedValue(null);
        mockUserRepo.getUserByEmail.mockResolvedValue(null);
        mockPrisma.$transaction.mockImplementation(async (callback) => {
          const tx = {
            user: {
              create: vi.fn().mockResolvedValue(newUser),
            },
            account: {
              create: vi.fn().mockResolvedValue({}),
            },
          };
          return callback(tx);
        });

        const result = await handleSignIn({
          account: createMockAccount() as any,
          profile: createMockProfile({ email: newUser.email }) as any,
        });

        expect(result).toBe(true);
        expect(mockPrisma.$transaction).toHaveBeenCalled();
        expect(mockAuditService.LoggedIn).toHaveBeenCalledWith({
          data: { userId: newUser.id },
        });
      });

      it('returns false when user creation fails', async () => {
        mockPrisma.account.findUnique.mockResolvedValue(null);
        mockUserRepo.getUserByEmail.mockResolvedValue(null);
        mockPrisma.$transaction.mockImplementation(async (callback) => {
          const tx = {
            user: {
              create: vi.fn().mockResolvedValue(null),
            },
            account: {
              create: vi.fn().mockResolvedValue({}),
            },
          };
          return callback(tx);
        });

        const result = await handleSignIn({
          account: createMockAccount() as any,
          profile: createMockProfile() as any,
        });

        expect(result).toBe(false);
      });
    });

    // describe('error handling', () => {
    //   it('returns false when getUserByEmail throws', async () => {
    //     mockPrisma.account.findUnique.mockResolvedValue(null);
    //     mockUserRepo.getUserByEmail.mockRejectedValue(new Error('Database error'));

    //     const result = await handleSignIn({
    //       account: createMockAccount() as any,
    //       profile: createMockProfile() as any,
    //     });

    //     expect(result).toBe(false);
    //   });

    //   it('returns false when transaction fails', async () => {
    //     mockPrisma.account.findUnique.mockResolvedValue(null);
    //     mockUserRepo.getUserByEmail.mockResolvedValue(null);
    //     mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'));

    //     const result = await handleSignIn({
    //       account: createMockAccount() as any,
    //       profile: createMockProfile() as any,
    //     });

    //     expect(result).toBe(false);
    //   });
    // });
  });
});
