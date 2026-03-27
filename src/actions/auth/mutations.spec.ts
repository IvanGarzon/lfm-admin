import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleSignIn } from '@/actions/auth/mutations';
import { testIds } from '@/lib/testing';

const { mockUserRepo, mockAccountRepo, mockAuditService, mockLogger } = vi.hoisted(() => ({
  mockUserRepo: {
    getUserByEmail: vi.fn(),
    createUserWithAccount: vi.fn(),
  },
  mockAccountRepo: {
    findByProviderAndAccountId: vi.fn(),
    createAccount: vi.fn(),
  },
  mockAuditService: {
    LoggedIn: vi.fn(),
  },
  mockLogger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/repositories/user-repository', () => {
  return {
    UserRepository: vi.fn().mockImplementation(function () {
      return mockUserRepo;
    }),
  };
});

vi.mock('@/repositories/account-repository', () => {
  return {
    AccountRepository: vi.fn().mockImplementation(function () {
      return mockAccountRepo;
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
  prisma: {},
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

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

describe('Auth Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleSignIn', () => {
    describe('validation', () => {
      it('returns error when account is null', async () => {
        const result = await handleSignIn({ account: null });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeDefined();
        }
      });

      it('returns error when email is missing in profile', async () => {
        const result = await handleSignIn({
          account: createMockAccount() as any,
          profile: { given_name: 'No', family_name: 'Email' } as any,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeDefined();
        }
      });

      it('returns error when email is empty string', async () => {
        const result = await handleSignIn({
          account: createMockAccount() as any,
          profile: createMockProfile({ email: '' }) as any,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeDefined();
        }
      });
    });

    describe('existing account sign-in', () => {
      it('allows sign-in and logs when account already exists', async () => {
        const existingAccount = { userId: TEST_USER_ID };
        mockAccountRepo.findByProviderAndAccountId.mockResolvedValue(existingAccount);

        const result = await handleSignIn({
          account: createMockAccount() as any,
          profile: createMockProfile() as any,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(true);
        }
        expect(mockAuditService.LoggedIn).toHaveBeenCalledWith({
          data: { userId: TEST_USER_ID },
        });
        expect(mockAccountRepo.createAccount).not.toHaveBeenCalled();
      });
    });

    describe('existing user without account', () => {
      it('creates account for existing user and allows sign-in', async () => {
        const existingUser = createMockUser();
        mockAccountRepo.findByProviderAndAccountId.mockResolvedValue(null);
        mockUserRepo.getUserByEmail.mockResolvedValue(existingUser);
        mockAccountRepo.createAccount.mockResolvedValue({});

        const result = await handleSignIn({
          account: createMockAccount() as any,
          profile: createMockProfile({ email: existingUser.email }) as any,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(true);
        }
        expect(mockAccountRepo.createAccount).toHaveBeenCalled();
        expect(mockAuditService.LoggedIn).toHaveBeenCalledWith({
          data: { userId: existingUser.id },
        });
      });
    });

    describe('new user sign-in', () => {
      it('creates new user and account when user does not exist', async () => {
        const newUser = createMockUser({ email: 'newuser@example.com' });
        mockAccountRepo.findByProviderAndAccountId.mockResolvedValue(null);
        mockUserRepo.getUserByEmail.mockResolvedValue(null);
        mockUserRepo.createUserWithAccount.mockResolvedValue(newUser);

        const result = await handleSignIn({
          account: createMockAccount() as any,
          profile: createMockProfile({ email: newUser.email }) as any,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(true);
        }
        expect(mockUserRepo.createUserWithAccount).toHaveBeenCalled();
        expect(mockAuditService.LoggedIn).toHaveBeenCalledWith({
          data: { userId: newUser.id },
        });
      });

      it('returns error when user creation fails', async () => {
        mockAccountRepo.findByProviderAndAccountId.mockResolvedValue(null);
        mockUserRepo.getUserByEmail.mockResolvedValue(null);
        mockUserRepo.createUserWithAccount.mockResolvedValue(null);

        const result = await handleSignIn({
          account: createMockAccount() as any,
          profile: createMockProfile() as any,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeDefined();
        }
      });
    });
  });
});
