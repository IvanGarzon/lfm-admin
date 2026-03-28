'use server';

import { SessionRepository } from '@/repositories/session-repository';
import type { SessionWithUser } from '@/features/sessions/types';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { withAuth } from '@/lib/action-auth';

const sessionRepo = new SessionRepository(prisma);

/**
 * Retrieves all active sessions for the current user.
 * Marks the current session and sorts it to the top of the list.
 * @returns A promise that resolves to an `ActionResult` containing the list of active sessions.
 */
export const getSessions = withAuth<void, SessionWithUser[]>(async (session) => {
  try {
    const currentSessionToken = session.sessionToken;
    const sessions = await sessionRepo.findActiveSessionsByUserId(
      session.user.id,
      currentSessionToken,
    );

    return { success: true, data: sessions };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch sessions', {
      action: 'getSessions',
      userId: session.user.id,
    });
  }
});
