'use server';

import { auth } from '@/auth';
import { SessionRepository } from '@/repositories/session-repository';
import type { SessionWithUser } from '@/features/sessions/types';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import type { ActionResult } from '@/types/actions';

const sessionRepo = new SessionRepository(prisma);

/**
 * Retrieves all active sessions for the current user.
 * Marks the current session and sorts it to the top of the list.
 * @returns A promise that resolves to an `ActionResult` containing the list of active sessions.
 */
export async function getSessions(): Promise<ActionResult<SessionWithUser[]>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

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
}
