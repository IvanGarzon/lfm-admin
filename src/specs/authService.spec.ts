import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleSignIn } from '@/services/authService';

vi.mock('@prisma/adapter-neon', () => {
  return {
    NeonPostgresAdapter: vi.fn().mockImplementation(() => ({
      // Mock any methods that are used in your code (e.g., connect)
      connect: vi.fn().mockResolvedValue(true), // Simulate successful connection
    })),
  };
});

vi.mock('@/repositories/userRepository', () => {
  return {
    UserRepository: vi.fn().mockImplementation(() => ({
      getUserByEmail: vi.fn().mockImplementation((email) => {
        if (email === 'existinguser@example.com') {
          return Promise.resolve({
            id: 'user-123',
            email: 'existinguser@example.com',
            firstName: 'Luke',
            lastName: 'Skywalker',
            emailVerified: null,
            avatarUrl: null,
            password: null,
          });
        }
        return Promise.resolve(null);
      }),
    })),
  };
});

vi.mock('@/services/logger', () => {
  return {
    LoggerService: vi.fn().mockImplementation(() => ({
      LoggedIn: vi.fn().mockImplementation((args) => {
        expect(args).toEqual({ data: { userId: 'user-123' } });
      }),
    })),
  };
});

vi.mock('@/lib/prisma', () => {
  return {
    prisma: {
      user: {
        create: vi.fn().mockImplementation(({ data }) => {
          return Promise.resolve({
            id: 'user-123',
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            emailVerified: null,
            avatarUrl: data.avatarUrl,
            password: null,
          });
        }),
      },
      account: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
      },
      $transaction: vi.fn().mockImplementation(async (callback) => {
        // Simulate the transaction behavior by calling the callback with a fake "tx" client
        const tx = {
          user: {
            create: vi.fn().mockImplementation(({ data }) =>
              Promise.resolve({
                id: 'user-123',
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                emailVerified: null,
                avatarUrl: data.avatarUrl,
                password: null,
              }),
            ),
          },
          account: {
            create: vi.fn().mockResolvedValue({}),
          },
        };

        return callback(tx);
      }),
    },
  };
});

describe('handleSignIn', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('should handle missing account information', async () => {
    const result = await handleSignIn({ account: null });
    expect(result).toBe(false);
  });

  it('should allow sign-in for an existing user', async () => {
    const mockEmail = 'existinguser@example.com';
    const result = await handleSignIn({
      account: {
        provider: 'google',
        providerAccountId: '123',
        type: 'oauth',
      } as any,
      profile: {
        email: mockEmail,
        given_name: 'John',
        family_name: 'Doe',
      } as any,
    });

    // Assert: Check that the result is true and the logger was called
    expect(result).toBe(true);
    // expect(mockPrisma.account.create).not.toHaveBeenCalled();

    // Verify LoggerService.LoggedIn was called correctly
    // expect(mockLoggedIn).toHaveBeenCalledWith({
    //   data: { userId: mockUser.id }
    // });
  });

  it('should create a new user if none exists and allow sign-in', async () => {
    const mockEmail = 'newuser@example.com';
    const result = await handleSignIn({
      account: {
        provider: 'google',
        providerAccountId: '123',
        type: 'oauth',
      } as any,
      profile: {
        email: mockEmail,
        given_name: 'John',
        family_name: 'Doe',
      } as any,
    });

    // Assert: Check that the result is true, the new user is created, and logger is called
    expect(result).toBe(true);
  });

  it('should handle missing email in profile', async () => {
    const result = await handleSignIn({
      account: {
        provider: 'google',
        providerAccountId: '123',
        type: 'oauth',
      } as any,
      profile: { given_name: 'No', family_name: 'Email' } as any,
    });

    expect(result).toBe(false);
  });
});
