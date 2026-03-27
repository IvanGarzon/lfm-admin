'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  skipToken,
  type QueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSessions as getSessionsAction } from '@/actions/sessions/queries';
import {
  deleteSession,
  deleteOtherSessions,
  deleteSessions,
  extendSession,
} from '@/actions/sessions/mutations';
import type { SessionWithUser } from '@/features/sessions/types';

// -- QUERY KEYS -------------------------------------------------------------

/**
 * Query key factory for session-related queries.
 * Provides type-safe, hierarchical query keys for React Query cache management.
 */
export const SESSION_KEYS = {
  all: ['sessions'] as const,
  lists: () => [...SESSION_KEYS.all, 'list'] as const,
  list: () => [...SESSION_KEYS.lists()] as const,
  details: () => [...SESSION_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...SESSION_KEYS.details(), id] as const,
};

// -- HELPER FUNCTIONS -------------------------------------------------------

/**
 * Invalidates session-related queries after mutations.
 * Ensures cache consistency across session lists and details.
 *
 * @param queryClient - The React Query client instance
 * @param options - Optional configuration for targeted invalidation
 * @param options.sessionId - Specific session ID to invalidate
 */
function invalidateSessionQueries(
  queryClient: QueryClient,
  options?: {
    sessionId?: string;
  },
) {
  if (options?.sessionId) {
    queryClient.invalidateQueries({ queryKey: SESSION_KEYS.detail(options.sessionId) });
  }

  queryClient.invalidateQueries({ queryKey: SESSION_KEYS.lists() });
}

// -- QUERY HOOKS (Data Fetching) --------------------------------------------

/**
 * Fetches all active sessions for the current user.
 * Automatically refetches when window regains focus to keep data synchronized across tabs.
 *
 * @returns Query result containing all active sessions
 *
 * @example
 * const { data: sessions, isLoading } = useSessions();
 *
 * Cache behaviour:
 * - Data is cached for 30 seconds to prevent excessive refetching
 * - Automatically refetches when window regains focus
 * - Cache is invalidated when sessions are deactivated, extended, or modified
 */
export function useSessions() {
  return useQuery({
    queryKey: SESSION_KEYS.list(),
    queryFn: async () => {
      const result = await getSessionsAction();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch sessions');
      }

      return result.data;
    },
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetches a single session by ID.
 * Useful for displaying detailed session information.
 *
 * @param id - The session ID (undefined disables the query)
 * @returns Query result containing the session details
 *
 * @example
 * const { data: session } = useSession(sessionId);
 *
 * Cache behaviour:
 * - Automatically disabled when id is undefined
 * - Data is cached for 30 seconds
 * - Cache is invalidated when session is modified
 */
export function useSession(id: string | undefined) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: SESSION_KEYS.detail(id ?? ''),
    queryFn: id
      ? async () => {
          // Try to find session in the list cache first
          const cachedSessions = queryClient.getQueryData<SessionWithUser[]>(SESSION_KEYS.list());
          const cachedSession = cachedSessions?.find((s) => s.id === id);

          if (cachedSession) {
            return cachedSession;
          }

          // If not in cache, we'd need a getSessionById action
          // For now, throw an error to indicate missing implementation
          throw new Error('Session not found in cache');
        }
      : skipToken,
    staleTime: 30 * 1000,
  });
}

// -- MUTATION HOOKS (Create/Update) -----------------------------------------

/**
 * Deactivates a specific session.
 * Implements optimistic updates for immediate UI feedback.
 * Rolls back changes on error.
 *
 * @returns Mutation hook for deactivating sessions
 *
 * @example
 * const { mutate: deactivateSession, isPending } = useDeleteSession();
 * deactivateSession('session-id');
 *
 * Cache behaviour:
 * - Optimistically removes session from cache
 * - Invalidates session list on success
 * - Rolls back to previous state on error
 *
 * Toast notifications:
 * - Success: "Session signed out successfully"
 * - Error: "Failed to sign out session"
 */
export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const result = await deleteSession({ sessionId });

      if (!result.success) {
        throw new Error(result.error || 'Unable to sign out session');
      }

      return result.data;
    },
    onMutate: async (sessionId: string) => {
      const listKey = SESSION_KEYS.list();

      await queryClient.cancelQueries({ queryKey: listKey });

      const previousSessions = queryClient.getQueryData<SessionWithUser[]>(listKey);

      if (previousSessions) {
        queryClient.setQueryData<SessionWithUser[]>(
          listKey,
          previousSessions.filter((s) => s.id !== sessionId),
        );
      }

      return { previousSessions };
    },
    onError: (error: Error, _sessionId, context) => {
      if (context?.previousSessions) {
        queryClient.setQueryData(SESSION_KEYS.list(), context.previousSessions);
      }
      toast.error(error.message || 'Failed to sign out session');
    },
    onSuccess: () => {
      invalidateSessionQueries(queryClient);
      toast.success('Session signed out successfully');
    },
  });
}

/**
 * Deactivates all sessions except the current one.
 * Useful for "Sign out all other devices" functionality.
 * Implements optimistic updates for immediate UI feedback.
 *
 * @returns Mutation hook for deactivating other sessions
 *
 * @example
 * const { mutate: signOutOthers, isPending } = useDeleteOtherSessions();
 * signOutOthers('current-session-id');
 *
 * Cache behaviour:
 * - Optimistically removes other sessions from cache
 * - Invalidates session list on success
 * - Rolls back to previous state on error
 *
 * Toast notifications:
 * - Success: "{count} session(s) signed out successfully"
 * - Error: "Failed to sign out other sessions"
 */
export function useDeleteOtherSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (currentSessionId: string) => {
      const result = await deleteOtherSessions({ currentSessionId });

      if (!result.success) {
        throw new Error(result.error || 'Unable to sign out other sessions');
      }

      return result.data;
    },
    onMutate: async (currentSessionId: string) => {
      const listKey = SESSION_KEYS.list();

      await queryClient.cancelQueries({ queryKey: listKey });

      const previousSessions = queryClient.getQueryData<SessionWithUser[]>(listKey);

      if (previousSessions) {
        queryClient.setQueryData<SessionWithUser[]>(
          listKey,
          previousSessions.filter((s) => s.id === currentSessionId),
        );
      }

      return { previousSessions };
    },
    onError: (error: Error, _currentSessionId, context) => {
      if (context?.previousSessions) {
        queryClient.setQueryData(SESSION_KEYS.list(), context.previousSessions);
      }
      toast.error(error.message || 'Failed to sign out other sessions');
    },
    onSuccess: (data: { deactivatedCount: number }) => {
      invalidateSessionQueries(queryClient);
      toast.success(`${data.deactivatedCount} session(s) signed out successfully`);
    },
  });
}

/**
 * Extends a session's expiration by 30 days.
 * Useful when users want to stay logged in longer without re-authenticating.
 * Implements optimistic updates for immediate UI feedback.
 *
 * @returns Mutation hook for extending sessions
 *
 * @example
 * const { mutate: extend, isPending } = useExtendSession();
 * extend('session-id');
 *
 * Cache behaviour:
 * - Optimistically updates session expiration in cache
 * - Invalidates session list on success
 * - Rolls back to previous state on error
 *
 * Toast notifications:
 * - Success: "Session extended successfully"
 * - Error: "Failed to extend session"
 */
export function useExtendSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const result = await extendSession({ sessionId });

      if (!result.success) {
        throw new Error(result.error || 'Unable to extend session');
      }

      return result.data;
    },
    onMutate: async (sessionId: string) => {
      const listKey = SESSION_KEYS.list();

      await queryClient.cancelQueries({ queryKey: listKey });

      const previousSessions = queryClient.getQueryData<SessionWithUser[]>(listKey);

      if (previousSessions) {
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + 30);

        queryClient.setQueryData<SessionWithUser[]>(
          listKey,
          previousSessions.map((s) => (s.id === sessionId ? { ...s, expires: newExpiry } : s)),
        );
      }

      return { previousSessions };
    },
    onError: (error: Error, _sessionId, context) => {
      if (context?.previousSessions) {
        queryClient.setQueryData(SESSION_KEYS.list(), context.previousSessions);
      }
      toast.error(error.message || 'Failed to extend session');
    },
    onSuccess: () => {
      invalidateSessionQueries(queryClient);
      toast.success('Session extended successfully');
    },
  });
}

/**
 * Deactivates multiple sessions at once (bulk operation).
 * Used for selecting and signing out multiple sessions simultaneously.
 * Implements optimistic updates for immediate UI feedback.
 *
 * @returns Mutation hook for bulk deactivating sessions
 *
 * @example
 * const { mutate: deleteMultiple, isPending } = useDeleteSessions();
 * deleteMultiple(['session-1', 'session-2']);
 *
 * Cache behaviour:
 * - Optimistically removes selected sessions from cache
 * - Invalidates session list on success
 * - Rolls back to previous state on error
 *
 * Toast notifications:
 * - Success: "{count} session(s) signed out successfully"
 * - Error: "Failed to sign out sessions"
 */
export function useDeleteSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionIds: string[]) => {
      const result = await deleteSessions({ sessionIds });

      if (!result.success) {
        throw new Error(result.error || 'Unable to sign out selected sessions');
      }

      return result.data;
    },
    onMutate: async (sessionIds: string[]) => {
      const listKey = SESSION_KEYS.list();

      await queryClient.cancelQueries({ queryKey: listKey });

      const previousSessions = queryClient.getQueryData<SessionWithUser[]>(listKey);

      if (previousSessions) {
        queryClient.setQueryData<SessionWithUser[]>(
          listKey,
          previousSessions.filter((s) => !sessionIds.includes(s.id)),
        );
      }

      return { previousSessions };
    },
    onError: (error: Error, _sessionIds, context) => {
      if (context?.previousSessions) {
        queryClient.setQueryData(SESSION_KEYS.list(), context.previousSessions);
      }
      toast.error(error.message || 'Failed to sign out sessions');
    },
    onSuccess: (data: { deactivatedCount: number }) => {
      invalidateSessionQueries(queryClient);
      toast.success(`${data.deactivatedCount} session(s) signed out successfully`);
    },
  });
}
