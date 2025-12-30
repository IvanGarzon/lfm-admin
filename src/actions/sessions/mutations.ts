'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { SessionRepository } from '@/repositories/session-repository';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { z } from 'zod';
import type { ActionResult } from '@/types/actions';

const sessionRepo = new SessionRepository(prisma);

// Validation schemas
const DeleteSessionsSchema = z.object({
  sessionIds: z.array(z.string()).min(1, 'Select at least one session'),
});

type DeleteSessionsInput = z.infer<typeof DeleteSessionsSchema>;

const UpdateSessionNameSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  deviceName: z.string().min(1, 'Device name is required'),
});

const DeleteSessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

const DeleteOtherSessionsSchema = z.object({
  currentSessionId: z.string().min(1, 'Current session ID is required'),
});

type UpdateSessionNameInput = z.infer<typeof UpdateSessionNameSchema>;
type DeleteSessionInput = z.infer<typeof DeleteSessionSchema>;
type DeleteOtherSessionsInput = z.infer<typeof DeleteOtherSessionsSchema>;

/**
 * Deactivates multiple sessions.
 * @param data - An object containing the list of session IDs to deactivate.
 * @returns A promise that resolves to an `ActionResult` with the count of deactivated sessions.
 */
export async function deleteSessions(
  data: DeleteSessionsInput,
): Promise<ActionResult<{ deactivatedCount: number }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'You must be signed in to manage sessions' };
  }

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
}

/**
 * Updates the device name for a specific session.
 * @param data - An object containing the session ID and new device name.
 * @returns A promise that resolves to an `ActionResult` with the session ID upon success.
 */
export async function updateSessionName(
  data: UpdateSessionNameInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'You must be signed in to update session names' };
  }

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
}

/**
 * Deactivates a specific session.
 * @param data - An object containing the session ID to deactivate.
 * @returns A promise that resolves to an `ActionResult` with the session ID upon success.
 */
export async function deleteSession(
  data: DeleteSessionInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'You must be signed in to sign out sessions' };
  }

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
}

/**
 * Deactivates all sessions except the current one.
 * @param data - An object containing the current session ID to keep active.
 * @returns A promise that resolves to an `ActionResult` with the count of deactivated sessions.
 */
export async function deleteOtherSessions(
  data: DeleteOtherSessionsInput,
): Promise<ActionResult<{ deactivatedCount: number }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'You must be signed in to manage sessions' };
  }

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
}

/**
 * Updates the session heartbeat (lastActiveAt timestamp).
 * This is called periodically by the client to track user activity.
 * @returns A promise that resolves to an `ActionResult` with success status.
 */
export async function updateSessionHeartbeat(): Promise<ActionResult<{ updated: boolean }>> {
  const session = await auth();
  if (!session?.user || !session.sessionToken) {
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
}

const ExtendSessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

type ExtendSessionInput = z.infer<typeof ExtendSessionSchema>;

/**
 * Extends a session's expiration by 30 days.
 * @param data - An object containing the session ID to extend.
 * @returns A promise that resolves to an `ActionResult` with the new expiration date.
 */
export async function extendSession(
  data: ExtendSessionInput,
): Promise<ActionResult<{ expires: Date }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'You must be signed in to extend sessions' };
  }

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
}
