import { Session, PrismaClient } from '@/prisma/client';
import type { SessionWithUser } from '@/features/sessions/types';

/**
 * Session Repository
 * Handles all database operations for sessions
 */
export class SessionRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Find all active sessions for a specific user
   * @param userId - The ID of the user
   * @param currentSessionToken - Optional current session token to mark as current
   * @returns Array of active sessions with user details
   */
  async findActiveSessionsByUserId(
    userId: string,
    currentSessionToken?: string | null,
  ): Promise<SessionWithUser[]> {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        isActive: true,
        expires: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Mark current session and sort
    const sessionsWithCurrent: SessionWithUser[] = sessions.map((s) => ({
      ...s,
      isCurrent: currentSessionToken ? s.sessionToken === currentSessionToken : false,
    }));

    // Sort sessions with current session at the top, then by creation date
    return sessionsWithCurrent.sort((a: SessionWithUser, b: SessionWithUser) => {
      // Current session always comes first
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;
      // If both are current or both are not current, sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  /**
   * Find a session by ID
   * @param id - The ID of the session
   * @returns The session or null if not found
   */
  async findById(id: string): Promise<Session | null> {
    return this.prisma.session.findUnique({
      where: { id },
    });
  }

  /**
   * Update session device name
   * @param id - The ID of the session
   * @param deviceName - The new device name
   * @returns The updated session
   */
  async updateDeviceName(id: string, deviceName: string): Promise<Session> {
    return this.prisma.session.update({
      where: { id },
      data: { deviceName },
    });
  }

  /**
   * Deactivate a specific session
   * @param id - The ID of the session to deactivate
   * @returns The updated session
   */
  async deactivate(id: string): Promise<Session> {
    return this.prisma.session.update({
      where: { id },
      data: {
        isActive: false,
        expires: new Date(),
      },
    });
  }

  /**
   * Deactivate all sessions except the specified one
   * @param userId - The ID of the user
   * @param exceptSessionId - The ID of the session to keep active
   * @returns The count of deactivated sessions
   */
  async deactivateOtherSessions(userId: string, exceptSessionId: string): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: {
        userId,
        id: {
          not: exceptSessionId,
        },
        isActive: true,
      },
      data: {
        isActive: false,
        expires: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Clean up expired sessions (can be run on a schedule)
   * @returns The count of cleaned up sessions
   */
  async cleanupExpired(): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: {
        expires: {
          lt: new Date(),
        },
        isActive: true,
      },
      data: { isActive: false },
    });

    return result.count;
  }

  /**
   * Verify that a session belongs to a specific user
   * @param sessionId - The ID of the session
   * @param userId - The ID of the user
   * @returns True if the session belongs to the user, false otherwise
   */
  async verifyOwnership(sessionId: string, userId: string): Promise<boolean> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    });

    return session?.userId === userId;
  }

  /**
   * Update the lastActiveAt timestamp for a session by its token
   * @param sessionToken - The session token to update
   * @returns The count of updated sessions (should be 0 or 1)
   */
  async updateHeartbeat(sessionToken: string): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: {
        sessionToken,
        isActive: true,
      },
      data: {
        lastActiveAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Extend a session's expiration date
   * @param id - The ID of the session to extend
   * @param newExpiry - The new expiration date
   * @returns The updated session
   */
  async extendSession(id: string, newExpiry: Date): Promise<Session> {
    return this.prisma.session.update({
      where: { id },
      data: {
        expires: newExpiry,
        isActive: true, // Ensure it's active
      },
    });
  }
  /**
   * Count active sessions for a user
   * @param userId - The ID of the user
   * @returns The number of active sessions
   */
  async countActiveSessions(userId: string): Promise<number> {
    return this.prisma.session.count({
      where: {
        userId,
        isActive: true,
        expires: {
          gt: new Date(),
        },
      },
    });
  }

  /**
   * Revoke the oldest active session for a user
   * @param userId - The ID of the user
   * @returns The revoked session or null if none found
   */
  async revokeOldestSession(userId: string): Promise<Session | null> {
    const oldestSession = await this.prisma.session.findFirst({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'asc', // Oldest first
      },
    });

    if (!oldestSession) return null;

    return this.prisma.session.update({
      where: { id: oldestSession.id },
      data: {
        isActive: false,
        expires: new Date(),
      },
    });
  }
  /**
   * Deactivate multiple sessions for a user
   * @param userId - The ID of the user
   * @param ids - The IDs of the sessions to deactivate
   * @returns The count of deactivated sessions
   */
  async deactivateMany(userId: string, ids: string[]): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: {
        userId,
        id: { in: ids },
      },
      data: {
        isActive: false,
        expires: new Date(),
      },
    });
    return result.count;
  }
  /**
   * Deactivate inactive sessions older than the threshold
   * @param threshold - The date threshold for inactivity
   * @returns The count of deactivated sessions
   */
  async deactivateInactive(threshold: Date): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: {
        isActive: true,
        OR: [
          { lastActiveAt: { lt: threshold } },
          { lastActiveAt: null, createdAt: { lt: threshold } },
        ],
      },
      data: {
        isActive: false,
        expires: new Date(),
      },
    });
    return result.count;
  }
}
