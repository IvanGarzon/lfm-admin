import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  deleteSessions,
  updateSessionName,
  deleteSession,
  deleteOtherSessions,
  updateSessionHeartbeat,
  extendSession,
} from '../mutations';
import {
  testIds,
  mockSessions,
  createDeleteSessionInput,
  createDeleteSessionsInput,
  createUpdateSessionNameInput,
  createDeleteOtherSessionsInput,
  createExtendSessionInput,
} from '@/lib/testing';

const { mockSessionRepo, mockAuth } = vi.hoisted(() => ({
  mockSessionRepo: {
    deactivateManySessions: vi.fn(),
    verifySessionOwnership: vi.fn(),
    updateSessionDeviceName: vi.fn(),
    deactivateSession: vi.fn(),
    deactivateOtherSessions: vi.fn(),
    updateSessionHeartbeat: vi.fn(),
    extendSession: vi.fn(),
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

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const unauthorizedError = 'You must be signed in to perform this action';

describe('Session Mutations', () => {
  const mockSession = mockSessions.manager();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
  });

  // -- deleteSessions --------------------------------------------------------

  describe('deleteSessions', () => {
    it('deactivates sessions when authorised', async () => {
      const input = createDeleteSessionsInput();
      mockSessionRepo.deactivateManySessions.mockResolvedValue(1);

      const result = await deleteSessions(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deactivatedCount).toBe(1);
      }
      expect(mockSessionRepo.deactivateManySessions).toHaveBeenCalledWith(
        mockSession.user.id,
        input.sessionIds,
      );
    });

    it('returns unauthorised when no session', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await deleteSessions(createDeleteSessionsInput());

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(unauthorizedError);
      }
    });

    it('returns error when repo throws', async () => {
      mockSessionRepo.deactivateManySessions.mockRejectedValue(new Error('DB error'));

      const result = await deleteSessions(createDeleteSessionsInput());

      expect(result.success).toBe(false);
    });
  });

  // -- updateSessionName -----------------------------------------------------

  describe('updateSessionName', () => {
    it('updates device name when authorised and owner', async () => {
      const input = createUpdateSessionNameInput();
      mockSessionRepo.verifySessionOwnership.mockResolvedValue(true);
      mockSessionRepo.updateSessionDeviceName.mockResolvedValue({ id: input.sessionId });

      const result = await updateSessionName(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(input.sessionId);
      }
      expect(mockSessionRepo.verifySessionOwnership).toHaveBeenCalledWith(
        input.sessionId,
        mockSession.user.id,
      );
      expect(mockSessionRepo.updateSessionDeviceName).toHaveBeenCalledWith(
        input.sessionId,
        input.deviceName,
      );
    });

    it('returns error when ownership check fails', async () => {
      mockSessionRepo.verifySessionOwnership.mockResolvedValue(false);

      const result = await updateSessionName(createUpdateSessionNameInput());

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('You can only update your own sessions');
      }
    });

    it('returns unauthorised when no session', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await updateSessionName(createUpdateSessionNameInput());

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(unauthorizedError);
      }
    });
  });

  // -- deleteSession ---------------------------------------------------------

  describe('deleteSession', () => {
    it('deactivates session when authorised and owner', async () => {
      const input = createDeleteSessionInput();
      mockSessionRepo.verifySessionOwnership.mockResolvedValue(true);
      mockSessionRepo.deactivateSession.mockResolvedValue({ id: input.sessionId });

      const result = await deleteSession(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(input.sessionId);
      }
      expect(mockSessionRepo.deactivateSession).toHaveBeenCalledWith(input.sessionId);
    });

    it('returns error when session not owned by user', async () => {
      mockSessionRepo.verifySessionOwnership.mockResolvedValue(false);

      const result = await deleteSession(createDeleteSessionInput());

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Session not found or access denied');
      }
    });

    it('returns unauthorised when no session', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await deleteSession(createDeleteSessionInput());

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(unauthorizedError);
      }
    });
  });

  // -- deleteOtherSessions ---------------------------------------------------

  describe('deleteOtherSessions', () => {
    it('deactivates other sessions when authorised and owner', async () => {
      const input = createDeleteOtherSessionsInput();
      mockSessionRepo.verifySessionOwnership.mockResolvedValue(true);
      mockSessionRepo.deactivateOtherSessions.mockResolvedValue(3);

      const result = await deleteOtherSessions(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deactivatedCount).toBe(3);
      }
      expect(mockSessionRepo.deactivateOtherSessions).toHaveBeenCalledWith(
        mockSession.user.id,
        input.currentSessionId,
      );
    });

    it('returns error when current session not owned by user', async () => {
      mockSessionRepo.verifySessionOwnership.mockResolvedValue(false);

      const result = await deleteOtherSessions(createDeleteOtherSessionsInput());

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Session not found or access denied');
      }
    });

    it('returns unauthorised when no session', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await deleteOtherSessions(createDeleteOtherSessionsInput());

      expect(result.success).toBe(false);
    });
  });

  // -- updateSessionHeartbeat ------------------------------------------------

  describe('updateSessionHeartbeat', () => {
    it('updates heartbeat when authorised with valid session token', async () => {
      mockSessionRepo.updateSessionHeartbeat.mockResolvedValue(1);

      const result = await updateSessionHeartbeat();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.updated).toBe(true);
      }
      expect(mockSessionRepo.updateSessionHeartbeat).toHaveBeenCalledWith(mockSession.sessionToken);
    });

    it('returns error when session has no token', async () => {
      mockAuth.mockResolvedValue({ ...mockSession, sessionToken: undefined });

      const result = await updateSessionHeartbeat();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Session expired. Please sign in again.');
      }
    });

    it('returns unauthorised when no session', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await updateSessionHeartbeat();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(unauthorizedError);
      }
    });
  });

  // -- extendSession ---------------------------------------------------------

  describe('extendSession', () => {
    it('extends session when authorised and owner', async () => {
      const input = createExtendSessionInput();
      const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      mockSessionRepo.verifySessionOwnership.mockResolvedValue(true);
      mockSessionRepo.extendSession.mockResolvedValue({ expires: newExpiry });

      const result = await extendSession(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.expires).toBeInstanceOf(Date);
      }
      expect(mockSessionRepo.verifySessionOwnership).toHaveBeenCalledWith(
        input.sessionId,
        mockSession.user.id,
      );
    });

    it('returns error when session not owned by user', async () => {
      mockSessionRepo.verifySessionOwnership.mockResolvedValue(false);

      const result = await extendSession(createExtendSessionInput());

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Session not found or access denied');
      }
    });

    it('returns unauthorised when no session', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await extendSession(createExtendSessionInput());

      expect(result.success).toBe(false);
    });
  });
});
