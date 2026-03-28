'use server';

import { revalidatePath } from 'next/cache';
import { SessionRepository } from '@/repositories/session-repository';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { z } from 'zod';
import { withAuth } from '@/lib/action-auth';
import {
  DeleteSessionSchema,
  DeleteSessionsSchema,
  DeleteOtherSessionsSchema,
  UpdateSessionNameSchema,
  ExtendSessionSchema,
  type DeleteSessionsInput,
  type UpdateSessionNameInput,
  type DeleteSessionInput,
  type DeleteOtherSessionsInput,
  type ExtendSessionInput,
} from '@/schemas/sessions';

const sessionRepo = new SessionRepository(prisma);

/**
 * Deactivates multiple sessions.
 * @param data - An object containing the list of session IDs to deactivate.
 * @returns A promise that resolves to an `ActionResult` with the count of deactivated sessions.
 */
export const deleteSessions = withAuth<DeleteSessionsInput, { deactivatedCount: number }>(
  async (session, data) => {
    try {
      const validatedData = DeleteSessionsSchema.parse(data);

      // Call the repository method which includes userId check in the update query
      // So we don't need explicit per-session ownership verification,
      // the query will only affect sessions belonging to this userId.
      const deactivatedCount = await sessionRepo.deactivateMany(
        session.user.id,
        validatedData.sessionIds,
      );

      revalidatePath('/sessions');

      return { success: true, data: { deactivatedCount } };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: 'Please select at least one session to sign out' };
      }
      return handleActionError(error, 'Unable to sign out selected sessions. Please try again.', {
        action: 'deleteSessions',
        userId: session.user.id,
      });
    }
  },
);

/**
 * Updates the device name for a specific session.
 * @param data - An object containing the session ID and new device name.
 * @returns A promise that resolves to an `ActionResult` with the session ID upon success.
 */
export const updateSessionName = withAuth<UpdateSessionNameInput, { id: string }>(
  async (session, data) => {
    try {
      const validatedData = UpdateSessionNameSchema.parse(data);

      // Verify ownership
      const isOwner = await sessionRepo.verifyOwnership(validatedData.sessionId, session.user.id);

      if (!isOwner) {
        return { success: false, error: 'You can only update your own sessions' };
      }

      await sessionRepo.updateDeviceName(validatedData.sessionId, validatedData.deviceName);

      revalidatePath('/sessions');

      return { success: true, data: { id: validatedData.sessionId } };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: 'Invalid session name provided' };
      }
      return handleActionError(error, 'Unable to update session name. Please try again.', {
        action: 'updateSessionName',
        userId: session.user.id,
        sessionId: data.sessionId,
      });
    }
  },
);

/**
 * Deactivates a specific session.
 * @param data - An object containing the session ID to deactivate.
 * @returns A promise that resolves to an `ActionResult` with the session ID upon success.
 */
export const deleteSession = withAuth<DeleteSessionInput, { id: string }>(async (session, data) => {
  try {
    const validatedData = DeleteSessionSchema.parse(data);

    // Verify ownership
    const isOwner = await sessionRepo.verifyOwnership(validatedData.sessionId, session.user.id);

    if (!isOwner) {
      return { success: false, error: 'Session not found or access denied' };
    }

    await sessionRepo.deactivate(validatedData.sessionId);

    revalidatePath('/sessions');

    return { success: true, data: { id: validatedData.sessionId } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid session ID provided' };
    }
    return handleActionError(error, 'Unable to sign out session. Please try again.', {
      action: 'deleteSession',
      userId: session.user.id,
      sessionId: data.sessionId,
    });
  }
});

/**
 * Deactivates all sessions except the current one.
 * @param data - An object containing the current session ID to keep active.
 * @returns A promise that resolves to an `ActionResult` with the count of deactivated sessions.
 */
export const deleteOtherSessions = withAuth<DeleteOtherSessionsInput, { deactivatedCount: number }>(
  async (session, data) => {
    try {
      const validatedData = DeleteOtherSessionsSchema.parse(data);

      // Verify ownership of the current session
      const isOwner = await sessionRepo.verifyOwnership(
        validatedData.currentSessionId,
        session.user.id,
      );

      if (!isOwner) {
        return { success: false, error: 'Session not found or access denied' };
      }

      const deactivatedCount = await sessionRepo.deactivateOtherSessions(
        session.user.id,
        validatedData.currentSessionId,
      );

      revalidatePath('/sessions');

      return { success: true, data: { deactivatedCount } };
    } catch (error) {
      return handleActionError(error, 'Unable to sign out other sessions. Please try again.', {
        action: 'deleteOtherSessions',
        userId: session.user.id,
        currentSessionId: data.currentSessionId,
      });
    }
  },
);

/**
 * Updates the session heartbeat (lastActiveAt timestamp).
 * This is called periodically by the client to track user activity.
 * @returns A promise that resolves to an `ActionResult` with success status.
 */
export const updateSessionHeartbeat = withAuth<void, { updated: boolean }>(async (session) => {
  if (!session.sessionToken) {
    return { success: false, error: 'Session expired. Please sign in again.' };
  }

  try {
    const updateCount = await sessionRepo.updateHeartbeat(session.sessionToken);

    return { success: true, data: { updated: updateCount > 0 } };
  } catch (error) {
    // Heartbeat failures are usually not critical, log but don't show to user
    return handleActionError(error, 'Session heartbeat update failed', {
      action: 'updateSessionHeartbeat',
      userId: session.user.id,
    });
  }
});

/**
 * Extends a session's expiration by 30 days.
 * @param data - An object containing the session ID to extend.
 * @returns A promise that resolves to an `ActionResult` with the new expiration date.
 */
export const extendSession = withAuth<ExtendSessionInput, { expires: Date }>(
  async (session, data) => {
    try {
      const validatedData = ExtendSessionSchema.parse(data);

      // Verify ownership
      const isOwner = await sessionRepo.verifyOwnership(validatedData.sessionId, session.user.id);

      if (!isOwner) {
        return { success: false, error: 'Session not found or access denied' };
      }

      // Extend by 30 days
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 30);

      const updatedSession = await sessionRepo.extendSession(validatedData.sessionId, newExpiry);

      revalidatePath('/sessions');

      return { success: true, data: { expires: updatedSession.expires } };
    } catch (error) {
      return handleActionError(error, 'Unable to extend session. Please try again.', {
        action: 'extendSession',
        userId: session.user.id,
        sessionId: data.sessionId,
      });
    }
  },
);
