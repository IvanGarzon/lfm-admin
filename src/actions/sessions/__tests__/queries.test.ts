import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSessions } from '../queries';
import { mockSessions, createSessionWithUser } from '@/lib/testing';

const { mockSessionRepo, mockAuth } = vi.hoisted(() => ({
  mockSessionRepo: {
    findActiveSessionsByUserId: vi.fn(),
  },
  mockAuth: vi.fn(),
}));

vi.mock('@/repositories/session-repository', () => ({
  SessionRepository: vi.fn().mockImplementation(function () {
    return mockSessionRepo;
  }),
}));

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {},
}));

const unauthorizedError = 'You must be signed in to perform this action';

describe('Session Queries', () => {
  const mockSession = mockSessions.manager();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
  });

  // -- getSessions -----------------------------------------------------------

  describe('getSessions', () => {
    it('returns active sessions when authorised', async () => {
      const current = createSessionWithUser({
        sessionToken: mockSession.sessionToken,
        isCurrent: true,
      });
      const other = createSessionWithUser();
      mockSessionRepo.findActiveSessionsByUserId.mockResolvedValue([current, other]);

      const result = await getSessions();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].isCurrent).toBe(true);
      }
      expect(mockSessionRepo.findActiveSessionsByUserId).toHaveBeenCalledWith(
        mockSession.user.id,
        mockSession.sessionToken,
      );
    });

    it('returns empty array when user has no active sessions', async () => {
      mockSessionRepo.findActiveSessionsByUserId.mockResolvedValue([]);

      const result = await getSessions();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it('returns unauthorised when no session', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getSessions();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(unauthorizedError);
      }
    });

    it('returns error when repo throws', async () => {
      mockSessionRepo.findActiveSessionsByUserId.mockRejectedValue(new Error('DB error'));

      const result = await getSessions();

      expect(result.success).toBe(false);
    });
  });
});
