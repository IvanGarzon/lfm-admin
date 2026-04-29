import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'node:crypto';
import { handleSignIn, initiateSignIn, verifyTwoFactorCode } from '@/actions/auth/mutations';
import { sendEmailNotification } from '@/lib/email-service';
import bcrypt from 'bcryptjs';
import { testIds } from '@/lib/testing';

const {
  mockUserRepo,
  mockAccountRepo,
  mockAuditService,
  mockLogger,
  mockTokenRepo,
  mockConfirmationRepo,
} = vi.hoisted(() => ({
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
    OtpRequested: vi.fn(),
    OtpVerified: vi.fn(),
    OtpFailed: vi.fn(),
    OtpLocked: vi.fn(),
    OtpExpired: vi.fn(),
  },
  mockLogger: {
    error: vi.fn(),
    info: vi.fn(),
  },
  mockTokenRepo: {
    upsertToken: vi.fn(),
    findByChallengeToken: vi.fn(),
    incrementAttempts: vi.fn(),
    markUsed: vi.fn(),
  },
  mockConfirmationRepo: {
    upsertByUserId: vi.fn(),
  },
}));

vi.mock('@/repositories/user-repository', () => ({
  UserRepository: vi.fn().mockImplementation(function () {
    return mockUserRepo;
  }),
}));

vi.mock('@/repositories/account-repository', () => ({
  AccountRepository: vi.fn().mockImplementation(function () {
    return mockAccountRepo;
  }),
}));

vi.mock('@/repositories/two-factor-token-repository', () => ({
  TwoFactorTokenRepository: vi.fn().mockImplementation(function () {
    return mockTokenRepo;
  }),
}));

vi.mock('@/repositories/two-factor-confirmation-repository', () => ({
  TwoFactorConfirmationRepository: vi.fn().mockImplementation(function () {
    return mockConfirmationRepo;
  }),
}));

vi.mock('@/services/audit.service', () => ({
  AuditService: vi.fn().mockImplementation(function () {
    return mockAuditService;
  }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {},
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

vi.mock('bcryptjs', () => ({
  default: { compare: vi.fn() },
}));

vi.mock('@/lib/agent', () => ({
  getClientDetails: vi.fn().mockResolvedValue({
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
  }),
}));

vi.mock('@/lib/email-service', () => ({
  sendEmailNotification: vi.fn(),
}));

// -- Helpers ------------------------------------------------------------------

const TEST_USER_ID = testIds.user();
const VALID_CODE = '123456';
const VALID_CODE_HASH = crypto.createHash('sha256').update(VALID_CODE).digest('hex');

function createMockUser(
  overrides: Partial<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string | null;
    isTwoFactorEnabled: boolean;
  }> = {},
) {
  return {
    id: TEST_USER_ID,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'hashed-password',
    isTwoFactorEnabled: false,
    ...overrides,
  };
}

function createMockToken(
  overrides: Partial<{
    id: string;
    userId: string;
    otpCode: string;
    challengeToken: string;
    expires: Date;
    usedAt: Date | null;
    numberOfAttempts: number;
  }> = {},
) {
  return {
    id: 'token-id',
    userId: TEST_USER_ID,
    otpCode: VALID_CODE_HASH,
    challengeToken: 'challenge-uuid',
    expires: new Date(Date.now() + 15 * 60 * 1000),
    usedAt: null,
    numberOfAttempts: 0,
    ...overrides,
  };
}

function createMockAccount(
  overrides: Partial<{ provider: string; providerAccountId: string; type: string }> = {},
) {
  return {
    provider: 'google',
    providerAccountId: 'provider-123',
    type: 'oauth',
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
    email: 'test@example.com',
    given_name: 'John',
    family_name: 'Doe',
    picture: 'https://example.com/avatar.jpg',
    ...overrides,
  };
}

// -- Tests --------------------------------------------------------------------

describe('Auth Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- handleSignIn -----------------------------------------------------------

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
        expect(mockAuditService.LoggedIn).toHaveBeenCalledWith({ data: { userId: TEST_USER_ID } });
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
        expect(mockUserRepo.createUserWithAccount).toHaveBeenCalled();
        expect(mockAuditService.LoggedIn).toHaveBeenCalledWith({ data: { userId: newUser.id } });
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

  // -- initiateSignIn ---------------------------------------------------------

  describe('initiateSignIn', () => {
    const validInput = { email: 'test@example.com', password: 'password123' };

    it('returns error when user is not found', async () => {
      mockUserRepo.getUserByEmail.mockResolvedValue(null);

      const result = await initiateSignIn(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid email or password');
      }
    });

    it('returns error when user has no password', async () => {
      mockUserRepo.getUserByEmail.mockResolvedValue(createMockUser({ password: null }));

      const result = await initiateSignIn(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid email or password');
      }
    });

    it('returns error when password is invalid', async () => {
      mockUserRepo.getUserByEmail.mockResolvedValue(createMockUser());
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await initiateSignIn(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid email or password');
      }
    });

    it('returns requiresOtp false when 2FA is disabled', async () => {
      mockUserRepo.getUserByEmail.mockResolvedValue(createMockUser({ isTwoFactorEnabled: false }));
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await initiateSignIn(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ requiresOtp: false });
      }
    });

    it('sends OTP and returns challengeToken when 2FA is enabled', async () => {
      mockUserRepo.getUserByEmail.mockResolvedValue(createMockUser({ isTwoFactorEnabled: true }));
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      mockTokenRepo.upsertToken.mockResolvedValue({ challengeToken: 'challenge-uuid' });
      vi.mocked(sendEmailNotification).mockResolvedValue({ success: true, emailId: 'email-id' });

      const result = await initiateSignIn(validInput);

      expect(result.success).toBe(true);
      if (result.success && result.data.requiresOtp) {
        expect(result.data.challengeToken).toBe('challenge-uuid');
      }
      expect(sendEmailNotification).toHaveBeenCalledWith(
        expect.objectContaining({ template: 'otp' }),
      );
      expect(mockAuditService.OtpRequested).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: TEST_USER_ID }) }),
      );
    });

    it('returns error when OTP email fails to send', async () => {
      mockUserRepo.getUserByEmail.mockResolvedValue(createMockUser({ isTwoFactorEnabled: true }));
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      mockTokenRepo.upsertToken.mockResolvedValue({ challengeToken: 'challenge-uuid' });
      vi.mocked(sendEmailNotification).mockRejectedValue(new Error('SMTP error'));

      const result = await initiateSignIn(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Failed to send verification code');
      }
    });
  });

  // -- verifyTwoFactorCode ----------------------------------------------------

  describe('verifyTwoFactorCode', () => {
    const validInput = { challengeToken: 'challenge-uuid', code: VALID_CODE };

    it('returns error when token is not found', async () => {
      mockTokenRepo.findByChallengeToken.mockResolvedValue(null);

      const result = await verifyTwoFactorCode(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid or expired');
      }
    });

    it('returns error when token has already been used', async () => {
      mockTokenRepo.findByChallengeToken.mockResolvedValue(createMockToken({ usedAt: new Date() }));

      const result = await verifyTwoFactorCode(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('already been used');
      }
    });

    it('returns error when token is expired', async () => {
      mockTokenRepo.findByChallengeToken.mockResolvedValue(
        createMockToken({ expires: new Date(Date.now() - 1000) }),
      );

      const result = await verifyTwoFactorCode(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('expired');
      }
    });

    it('returns remaining attempts on wrong code', async () => {
      mockTokenRepo.findByChallengeToken.mockResolvedValue(createMockToken());
      mockTokenRepo.incrementAttempts.mockResolvedValue({ numberOfAttempts: 1 });

      const result = await verifyTwoFactorCode({
        challengeToken: 'challenge-uuid',
        code: '000000',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('4 attempts remaining');
      }
      expect(mockTokenRepo.incrementAttempts).toHaveBeenCalledWith('token-id');
      expect(mockAuditService.OtpFailed).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ attemptsRemaining: 4 }) }),
      );
    });

    it('locks the token after max attempts', async () => {
      mockTokenRepo.findByChallengeToken.mockResolvedValue(createMockToken());
      mockTokenRepo.incrementAttempts.mockResolvedValue({ numberOfAttempts: 5 });

      const result = await verifyTwoFactorCode({
        challengeToken: 'challenge-uuid',
        code: '000000',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Too many incorrect attempts');
      }
      expect(mockTokenRepo.markUsed).toHaveBeenCalledWith('token-id');
      expect(mockAuditService.OtpLocked).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: TEST_USER_ID }) }),
      );
    });

    it('audits expiry when token is expired', async () => {
      mockTokenRepo.findByChallengeToken.mockResolvedValue(
        createMockToken({ expires: new Date(Date.now() - 1000) }),
      );

      await verifyTwoFactorCode(validInput);

      expect(mockAuditService.OtpExpired).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: TEST_USER_ID }) }),
      );
    });

    it('returns verified true and writes confirmation on correct code', async () => {
      mockTokenRepo.findByChallengeToken.mockResolvedValue(createMockToken());
      mockTokenRepo.markUsed.mockResolvedValue({});
      mockConfirmationRepo.upsertByUserId.mockResolvedValue({});

      const result = await verifyTwoFactorCode(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ verified: true });
      }
      expect(mockTokenRepo.markUsed).toHaveBeenCalledWith('token-id', '127.0.0.1');
      expect(mockConfirmationRepo.upsertByUserId).toHaveBeenCalledWith(TEST_USER_ID);
      expect(mockAuditService.OtpVerified).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: TEST_USER_ID }) }),
      );
    });
  });
});
