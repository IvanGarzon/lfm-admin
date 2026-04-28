/**
 * TwoFactorTokenRepository Integration Tests
 *
 * Tests the repository against a real Postgres database.
 * Run with: pnpm test:integration
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { TwoFactorTokenRepository } from '../two-factor-token-repository';
import {
  setupTestDatabaseLifecycle,
  getTestPrisma,
  createTestTenant,
} from '@/lib/testing/integration/database';
import { createUserData } from '@/lib/testing';
import crypto from 'node:crypto';

vi.mock('@/lib/prisma', () => ({ prisma: {} }));

setupTestDatabaseLifecycle();

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

async function createTestUser(tenantId: string, email?: string) {
  return getTestPrisma().user.create({
    data: { ...createUserData({ email }), tenantId },
    select: { id: true, email: true },
  });
}

describe('TwoFactorTokenRepository (integration)', () => {
  let repository: TwoFactorTokenRepository;
  let tenantId: string;
  let userId: string;

  beforeAll(() => {
    repository = new TwoFactorTokenRepository(getTestPrisma());
  });

  beforeEach(async () => {
    ({ id: tenantId } = await createTestTenant({ name: '2FA Test Tenant' }));
    ({ id: userId } = await createTestUser(tenantId));
  });

  // -- upsertToken -----------------------------------------------------------

  describe('upsertToken', () => {
    it('creates a new token record', async () => {
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      const result = await repository.upsertToken({
        userId,
        hashedCode: hashCode('123456'),
        expires,
      });

      expect(result.userId).toBe(userId);
      expect(result.otpCode).toBe(hashCode('123456'));
      expect(result.numberOfAttempts).toBe(0);
      expect(result.usedAt).toBeNull();
    });

    it('replaces existing token for same userId', async () => {
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      await repository.upsertToken({ userId, hashedCode: hashCode('111111'), expires });
      const second = await repository.upsertToken({
        userId,
        hashedCode: hashCode('222222'),
        expires,
      });

      const db = getTestPrisma();
      const tokens = await db.twoFactorToken.findMany({ where: { userId } });
      expect(tokens).toHaveLength(1);
      expect(second.otpCode).toBe(hashCode('222222'));
    });

    it('stores optional userAgent and requestedIpAddress', async () => {
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      const result = await repository.upsertToken({
        userId,
        hashedCode: hashCode('123456'),
        expires,
        userAgent: 'Mozilla/5.0',
        requestedIpAddress: '127.0.0.1',
      });

      expect(result.userAgent).toBe('Mozilla/5.0');
      expect(result.requestedIpAddress).toBe('127.0.0.1');
    });
  });

  // -- findByChallengeToken --------------------------------------------------

  describe('findByChallengeToken', () => {
    it('returns the token record by challengeToken', async () => {
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      const created = await repository.upsertToken({
        userId,
        hashedCode: hashCode('123456'),
        expires,
      });

      const found = await repository.findByChallengeToken(created.challengeToken);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
    });

    it('returns null for unknown challengeToken', async () => {
      const found = await repository.findByChallengeToken('nonexistent-token');
      expect(found).toBeNull();
    });
  });

  // -- incrementAttempts -----------------------------------------------------

  describe('incrementAttempts', () => {
    it('increments numberOfAttempts by 1', async () => {
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      const token = await repository.upsertToken({
        userId,
        hashedCode: hashCode('123456'),
        expires,
      });

      await repository.incrementAttempts(token.id);
      const updated = await getTestPrisma().twoFactorToken.findUnique({ where: { id: token.id } });
      expect(updated?.numberOfAttempts).toBe(1);
    });
  });

  // -- markUsed --------------------------------------------------------------

  describe('markUsed', () => {
    it('sets usedAt timestamp', async () => {
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      const token = await repository.upsertToken({
        userId,
        hashedCode: hashCode('123456'),
        expires,
      });

      await repository.markUsed(token.id);
      const updated = await getTestPrisma().twoFactorToken.findUnique({ where: { id: token.id } });
      expect(updated?.usedAt).not.toBeNull();
    });

    it('stores loggedInIpAddress when provided', async () => {
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      const token = await repository.upsertToken({
        userId,
        hashedCode: hashCode('123456'),
        expires,
      });

      await repository.markUsed(token.id, '192.168.1.1');
      const updated = await getTestPrisma().twoFactorToken.findUnique({ where: { id: token.id } });
      expect(updated?.loggedInIpAddress).toBe('192.168.1.1');
    });
  });
});
