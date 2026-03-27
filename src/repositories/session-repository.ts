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
   * Find a session by its unique ID.
   * @param id - The ID of the session
   * @returns A promise that resolves to the session object or null if not found
   */
  async findById(id: string): Promise<Session | null> {
    return this.prisma.session.findUnique({
      where: { id },
    });
  }

  /**
   * Update the device name associated with a session.
   * Useful for identifying which device a session belongs to in the UI.
   * @param id - The unique ID of the session
   * @param deviceName - The human-readable name of the device (e.g., "iPhone 13")
   * @returns A promise that resolves to the updated session
   */
  async updateDeviceName(id: string, deviceName: string): Promise<Session> {
    return this.prisma.session.update({
      where: { id },
      data: { deviceName },
    });
  }

  /**
   * Deactivates a specific session immediately.
   * Sets isActive to false and expiration date to now.
   * @param id - The unique ID of the session to deactivate
   * @returns A promise that resolves to the updated session record
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
   * Deactivates all active sessions for a user EXCEPT the specified one.
   * Commonly used for "log out of other devices" features.
   * @param userId - The user ID whose other sessions should be deactivated
   * @param exceptSessionId - The ID of the session to keep active
   * @returns A promise that resolves to the count of deactivated sessions
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
   * Cleans up all sessions that have passed their expiration date.
   * Marks them as inactive in the database.
   * @returns A promise that resolves to the count of sessions updated
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
   * Verifies that a specific session belongs to a given user.
   * Security utility for session management operations.
   * @param sessionId - The ID of the session to check
   * @param userId - The ID of the user to verify against
   * @returns A promise that resolves to true if ownership is confirmed
   */
  async verifyOwnership(sessionId: string, userId: string): Promise<boolean> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    });

    return session?.userId === userId;
  }

  /**
   * Inform the database that a session is still active by updating its heartbeat timestamp.
   * @param sessionToken - The raw session token used to identify the session
   * @returns A promise that resolves to the count of updated records (usually 0 or 1)
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
   * Extends the lifespan of a session by setting a new expiration date.
   * Also ensures the session is marked as active.
   * @param id - The unique ID of the session to extend
   * @param newExpiry - The new Date when the session should expire
   * @returns A promise that resolves to the updated session
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
   * Counts the current number of valid active sessions for a user.
   * Only counts sessions that are marked active AND have not expired.
   * @param userId - The user ID to check
   * @returns A promise that resolves to the number of active sessions
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
   * Revokes the chronologically oldest active session for a specific user.
   * Useful for enforcing concurrent session limits.
   * @param userId - The ID of the user
   * @returns A promise that resolves to the revoked session or null if no active sessions exist
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

    if (!oldestSession) {
      return null;
    }

    return this.prisma.session.update({
      where: { id: oldestSession.id },
      data: {
        isActive: false,
        expires: new Date(),
      },
    });
  }

  /**
   * Batch deactivates a list of specific sessions for a user.
   * @param userId - The ID of the user owning the sessions
   * @param ids - Array of session IDs to deactivate
   * @returns A promise that resolves to the count of deactivated sessions
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
   * Deactivates all sessions that show no activity since the threshold date.
   * @param threshold - The date before which any activity is considered "inactive"
   * @returns A promise that resolves to the total count of deactivated sessions
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

  /**
   * Deactivates a session by its session token.
   * Used during sign-out to invalidate the current session.
   * @param sessionToken - The session token to deactivate
   * @returns A promise that resolves to the count of deactivated sessions
   */
  async deactivateBySessionToken(sessionToken: string): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: {
        sessionToken,
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
   * Finds a session by its session token.
   * @param sessionToken - The session token to search for
   * @returns A promise that resolves to the session or null if not found
   */
  async findBySessionToken(sessionToken: string): Promise<Session | null> {
    return this.prisma.session.findUnique({
      where: { sessionToken },
    });
  }

  /**
   * Checks if a session is active and not expired.
   * @param sessionToken - The session token to check
   * @returns A promise that resolves to true if session is active and valid
   */
  async isSessionActive(sessionToken: string): Promise<boolean> {
    const session = await this.prisma.session.findUnique({
      where: { sessionToken },
      select: { isActive: true, expires: true },
    });

    if (!session) return false;
    return session.isActive && session.expires > new Date();
  }

  /**
   * Finds the most recent active session for a user.
   * @param userId - The user ID to search for
   * @returns A promise that resolves to the latest session or null if none found
   */
  async findLatestActiveByUserId(userId: string): Promise<Session | null> {
    return this.prisma.session.findFirst({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Creates a new session record.
   * @param data - The session data to create
   * @returns A promise that resolves to the created session
   */
  async createSession(data: {
    userId: string;
    sessionToken: string;
    expires: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
    deviceType?: string | null;
    deviceVendor?: string | null;
    deviceModel?: string | null;
    osName?: string | null;
    osVersion?: string | null;
    browserName?: string | null;
    browserVersion?: string | null;
    country?: string | null;
    region?: string | null;
    city?: string | null;
    timezone?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    deviceName?: string | null;
    lastActiveAt?: Date;
  }): Promise<Session> {
    return this.prisma.session.create({ data });
  }

  /**
   * Updates the location data for a session.
   * Used for background geolocation updates after sign-in.
   * @param sessionToken - The session token to update
   * @param locationData - Location information from IP geolocation
   * @returns A promise that resolves to the updated session or null if not found
   */
  async updateLocation(
    sessionToken: string,
    locationData: {
      country?: string;
      region?: string;
      city?: string;
      timezone?: string;
      latitude?: number;
      longitude?: number;
    },
  ): Promise<Session | null> {
    try {
      return await this.prisma.session.update({
        where: { sessionToken },
        data: locationData,
      });
    } catch (error) {
      return null;
    }
  }
}
