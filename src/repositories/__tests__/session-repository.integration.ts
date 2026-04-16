/**
 * SessionRepository Integration Tests
 *
 * Tests the repository against a real Postgres database spun up via
 * Testcontainers. No mocks — every assertion hits an actual DB query.
 *
 * Run with: pnpm test:integration
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { SessionRepository } from '../session-repository';
import {
  setupTestDatabaseLifecycle,
  getTestPrisma,
  createTestTenant,
} from '@/lib/testing/integration/database';

// Prevent the module-level singleton from running before the container is ready.
vi.mock('@/lib/prisma', () => ({ prisma: {} }));

setupTestDatabaseLifecycle();

// -- Helpers -----------------------------------------------------------------

async function createTestUser(overrides: { tenantId?: string; email?: string } = {}) {
  const db = getTestPrisma();
  return db.user.create({
    data: {
      firstName: 'Test',
      lastName: 'User',
      email: overrides.email ?? `test-${Date.now()}-${Math.random()}@example.com`,
      tenantId: overrides.tenantId,
    },
    select: { id: true },
  });
}

async function createTestSession(
  userId: string,
  overrides: { sessionToken?: string; isActive?: boolean; expires?: Date } = {},
) {
  const db = getTestPrisma();
  return db.session.create({
    data: {
      userId,
      sessionToken: overrides.sessionToken ?? `tok-${Date.now()}-${Math.random()}`,
      expires: overrides.expires ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
      isActive: overrides.isActive ?? true,
    },
    select: { id: true, sessionToken: true },
  });
}

// -- Tests -------------------------------------------------------------------

describe('SessionRepository (integration)', () => {
  let repository: SessionRepository;
  let tenantId: string;
  let userId: string;

  beforeAll(() => {
    repository = new SessionRepository(getTestPrisma());
  });

  beforeEach(async () => {
    ({ id: tenantId } = await createTestTenant({ name: 'Session Test Tenant' }));
    ({ id: userId } = await createTestUser({ tenantId }));
  });

  // -- createSession ---------------------------------------------------------

  describe('createSession', () => {
    it('creates a session and returns it', async () => {
      const token = `tok-create-${Date.now()}`;
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const result = await repository.createSession({
        userId,
        sessionToken: token,
        expires,
      });

      expect(result.id).toBeDefined();
      expect(result.sessionToken).toBe(token);
      expect(result.isActive).toBe(true);
    });
  });

  // -- findActiveSessionsByUserId --------------------------------------------

  describe('findActiveSessionsByUserId', () => {
    it('returns only active non-expired sessions for the user', async () => {
      const { sessionToken } = await createTestSession(userId);
      // expired session — should be excluded
      await createTestSession(userId, { expires: new Date(Date.now() - 1000) });

      const results = await repository.findActiveSessionsByUserId(userId);

      expect(results).toHaveLength(1);
      expect(results[0].sessionToken).toBe(sessionToken);
    });

    it('marks the current session with isCurrent = true', async () => {
      const { sessionToken: current } = await createTestSession(userId);
      await createTestSession(userId);

      const results = await repository.findActiveSessionsByUserId(userId, current);

      const currentSession = results.find((s) => s.sessionToken === current);
      expect(currentSession?.isCurrent).toBe(true);
      const others = results.filter((s) => s.sessionToken !== current);
      others.forEach((s) => expect(s.isCurrent).toBe(false));
    });

    it('returns empty array when user has no active sessions', async () => {
      const results = await repository.findActiveSessionsByUserId(userId);
      expect(results).toHaveLength(0);
    });

    it('does not return sessions belonging to another user', async () => {
      const { id: otherUserId } = await createTestUser({ tenantId });
      await createTestSession(otherUserId);

      const results = await repository.findActiveSessionsByUserId(userId);
      expect(results).toHaveLength(0);
    });
  });

  // -- verifySessionOwnership ------------------------------------------------

  describe('verifySessionOwnership', () => {
    it('returns true when session belongs to the user', async () => {
      const { id: sessionId } = await createTestSession(userId);

      const result = await repository.verifySessionOwnership(sessionId, userId);

      expect(result).toBe(true);
    });

    it('returns false when session belongs to a different user', async () => {
      const { id: otherUserId } = await createTestUser({ tenantId });
      const { id: sessionId } = await createTestSession(otherUserId);

      const result = await repository.verifySessionOwnership(sessionId, userId);

      expect(result).toBe(false);
    });

    it('returns false for a non-existent session ID', async () => {
      const result = await repository.verifySessionOwnership('cltest000000000000none0001', userId);
      expect(result).toBe(false);
    });
  });

  // -- deactivateSession -----------------------------------------------------

  describe('deactivateSession', () => {
    it('sets isActive to false', async () => {
      const { id: sessionId } = await createTestSession(userId);

      await repository.deactivateSession(sessionId);

      const db = getTestPrisma();
      const session = await db.session.findUnique({ where: { id: sessionId } });
      expect(session!.isActive).toBe(false);
    });
  });

  // -- deactivateManySessions ------------------------------------------------

  describe('deactivateManySessions', () => {
    it('deactivates only the specified sessions for the user', async () => {
      const s1 = await createTestSession(userId);
      const s2 = await createTestSession(userId);
      const s3 = await createTestSession(userId);

      const count = await repository.deactivateManySessions(userId, [s1.id, s2.id]);

      expect(count).toBe(2);

      const db = getTestPrisma();
      const remaining = await db.session.findMany({
        where: { userId, isActive: true },
        select: { id: true },
      });
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(s3.id);
    });

    it('does not deactivate sessions belonging to another user', async () => {
      const { id: otherUserId } = await createTestUser({ tenantId });
      const { id: otherId } = await createTestSession(otherUserId);

      const count = await repository.deactivateManySessions(userId, [otherId]);

      expect(count).toBe(0);

      const db = getTestPrisma();
      const session = await db.session.findUnique({ where: { id: otherId } });
      expect(session!.isActive).toBe(true);
    });
  });

  // -- deactivateOtherSessions -----------------------------------------------

  describe('deactivateOtherSessions', () => {
    it('deactivates all sessions except the specified one', async () => {
      const keep = await createTestSession(userId);
      await createTestSession(userId);
      await createTestSession(userId);

      const count = await repository.deactivateOtherSessions(userId, keep.id);

      expect(count).toBe(2);

      const db = getTestPrisma();
      const active = await db.session.findMany({ where: { userId, isActive: true } });
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe(keep.id);
    });
  });

  // -- updateSessionDeviceName -----------------------------------------------

  describe('updateSessionDeviceName', () => {
    it('updates the deviceName field', async () => {
      const { id: sessionId } = await createTestSession(userId);

      await repository.updateSessionDeviceName(sessionId, 'MacBook Pro');

      const db = getTestPrisma();
      const session = await db.session.findUnique({ where: { id: sessionId } });
      expect(session!.deviceName).toBe('MacBook Pro');
    });
  });

  // -- updateSessionHeartbeat ------------------------------------------------

  describe('updateSessionHeartbeat', () => {
    it('updates lastActiveAt for the matching token', async () => {
      const { sessionToken } = await createTestSession(userId);

      const count = await repository.updateSessionHeartbeat(sessionToken);

      expect(count).toBe(1);

      const db = getTestPrisma();
      const session = await db.session.findUnique({ where: { sessionToken } });
      expect(session!.lastActiveAt).not.toBeNull();
    });

    it('returns 0 for a non-existent token', async () => {
      const count = await repository.updateSessionHeartbeat('non-existent-token');
      expect(count).toBe(0);
    });
  });

  // -- extendSession ---------------------------------------------------------

  describe('extendSession', () => {
    it('updates expiry and ensures session is active', async () => {
      const { id: sessionId } = await createTestSession(userId);
      const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const result = await repository.extendSession(sessionId, newExpiry);

      expect(result.expires.getTime()).toBeCloseTo(newExpiry.getTime(), -3);
      expect(result.isActive).toBe(true);
    });
  });

  // -- countActiveSessions ---------------------------------------------------

  describe('countActiveSessions', () => {
    it('counts only active non-expired sessions', async () => {
      await createTestSession(userId);
      await createTestSession(userId);
      await createTestSession(userId, { expires: new Date(Date.now() - 1000) });

      const count = await repository.countActiveSessions(userId);

      expect(count).toBe(2);
    });

    it('does not count sessions from another user', async () => {
      const { id: otherId } = await createTestUser({ tenantId });
      await createTestSession(otherId);

      const count = await repository.countActiveSessions(userId);
      expect(count).toBe(0);
    });
  });

  // -- revokeOldestSession ---------------------------------------------------

  describe('revokeOldestSession', () => {
    it('deactivates the oldest active session', async () => {
      const db = getTestPrisma();
      // Create sessions with distinct timestamps
      const old = await createTestSession(userId);
      await new Promise((r) => setTimeout(r, 5));
      await createTestSession(userId);

      const revoked = await repository.revokeOldestSession(userId);

      expect(revoked).not.toBeNull();
      const check = await db.session.findUnique({ where: { id: old.id } });
      expect(check!.isActive).toBe(false);
    });

    it('returns null when user has no active sessions', async () => {
      const result = await repository.revokeOldestSession(userId);
      expect(result).toBeNull();
    });
  });

  // -- isSessionActive -------------------------------------------------------

  describe('isSessionActive', () => {
    it('returns true for an active non-expired session', async () => {
      const { sessionToken } = await createTestSession(userId);

      const result = await repository.isSessionActive(sessionToken);
      expect(result).toBe(true);
    });

    it('returns false for an expired session', async () => {
      const { sessionToken } = await createTestSession(userId, {
        expires: new Date(Date.now() - 1000),
      });

      const result = await repository.isSessionActive(sessionToken);
      expect(result).toBe(false);
    });

    it('returns false for a non-existent token', async () => {
      const result = await repository.isSessionActive('non-existent-token');
      expect(result).toBe(false);
    });
  });
});
