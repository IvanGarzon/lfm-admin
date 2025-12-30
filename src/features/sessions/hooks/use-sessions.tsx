import { useQueryClient, QueryFunction, useMutation } from '@tanstack/react-query';
import {
  getSessions as getSessionsAction,
  deleteSession,
  deleteOtherSessions,
  extendSession,
} from '@/actions/sessions';
import { toast } from 'sonner';
import type { SessionWithUser } from '@/features/sessions/types';

// Query keys as constants
export const QueryKeys = {
  SESSION: {
    GET_ALL: 'SESSIONS_GET_ALL',
    GET_BY_ID: 'SESSION_GET_BY_ID',
  },
};

export const MutationKeys = {
  SESSION: {
    DELETE: 'SESSION_DELETE',
    DELETE_OTHERS: 'SESSION_DELETE_OTHERS',
  },
};

// Create a type that's compatible with both useQuery and useSuspenseQuery
type QueryOptions<T, E = Error> = {
  queryKey: readonly [string, {}];
  queryFn: QueryFunction<T, readonly [string, {}], E>;
  placeholderData?: (previousData: T | undefined) => T | undefined;
  initialData?: () => T | undefined;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
};

/**
 * Creates query options for fetching all sessions.
 * This function is used internally by useSessions and can be used with useQuery or useSuspenseQuery.
 *
 * @param queryParams - Query parameters (currently unused, reserved for future filtering)
 * @returns Query options object with queryKey and queryFn
 * @throws {Error} If the session fetch fails
 *
 * @example
 * ```ts
 * const { data } = useQuery(getSessions({}));
 * ```
 */
export const getSessions = (queryParams: {}): Pick<
  QueryOptions<SessionWithUser[], Error>,
  'queryKey' | 'queryFn'
> => {
  return {
    queryKey: [QueryKeys.SESSION.GET_ALL, queryParams] as const,
    queryFn: async () => {
      const result = await getSessionsAction();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch sessions');
      }

      return result.data;
    },
  };
};

/**
 * Hook to fetch and manage all active sessions for the current user.
 * Automatically refetches when window regains focus to keep data synchronized across tabs.
 *
 * @param params - Query parameters (currently unused, reserved for future filtering)
 * @returns Query options with session data, loading state, and error handling
 *
 * @example
 * ```tsx
 * const { data: sessions, isLoading, error } = useQuery(useSessions({}));
 * ```
 */
export function useSessions(params: {}): QueryOptions<SessionWithUser[], Error> {
  const queryClient = useQueryClient();

  return {
    ...getSessions({}),
    placeholderData: (previousData) => previousData,
    initialData: () =>
      queryClient.getQueryData<SessionWithUser[]>([QueryKeys.SESSION.GET_ALL]) || undefined,
    refetchOnWindowFocus: true, // Refetch when window gets focus to sync across browsers
    staleTime: 0, // Always consider data stale to ensure fresh data
  };
}

/**
 * Hook to delete (deactivate) a specific session.
 * Automatically invalidates the sessions cache and shows toast notifications.
 *
 * @returns Mutation object with mutate function and loading/error states
 *
 * @example
 * ```tsx
 * const { mutate: deleteSession, isPending } = useDeleteSession();
 *
 * const handleSignOut = (sessionId: string) => {
 *   deleteSession(sessionId);
 * };
 * ```
 */
export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MutationKeys.SESSION.DELETE],
    retry: 2, // Retry failed mutations up to 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    mutationFn: async (sessionId: string) => {
      const result = await deleteSession({ sessionId });

      if (!result.success) {
        throw new Error(result.error || 'Unable to sign out session');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.SESSION.GET_ALL] });
      toast.success('Session signed out successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to sign out session');
    },
  });
}

/**
 * Hook to delete all sessions except the current one.
 * Useful for "Sign out all other devices" functionality.
 *
 * @returns Mutation object with mutate function and loading/error states
 *
 * @example
 * ```tsx
 * const { mutate: deleteOthers, isPending } = useDeleteOtherSessions();
 *
 * const handleSignOutAll = (currentSessionId: string) => {
 *   deleteOthers(currentSessionId);
 * };
 * ```
 */
export function useDeleteOtherSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MutationKeys.SESSION.DELETE_OTHERS],
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    mutationFn: async (currentSessionId: string) => {
      const result = await deleteOtherSessions({ currentSessionId });

      if (!result.success) {
        throw new Error(result.error || 'Unable to sign out other sessions');
      }

      return result.data;
    },
    onSuccess: (data: { deactivatedCount: number }) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.SESSION.GET_ALL] });
      toast.success(`${data.deactivatedCount} session(s) signed out successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to sign out other sessions');
    },
  });
}

/**
 * Hook to extend a session's expiration by 30 days.
 * Useful when users want to stay logged in longer without re-authenticating.
 *
 * @returns Mutation object with mutate function and loading/error states
 *
 * @example
 * ```tsx
 * const { mutate: extendSession, isPending } = useExtendSession();
 *
 * const handleExtend = (sessionId: string) => {
 *   extendSession(sessionId);
 * };
 * ```
 */
export function useExtendSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['SESSION_EXTEND'],
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    mutationFn: async (sessionId: string) => {
      const result = await extendSession({ sessionId });

      if (!result.success) {
        throw new Error(result.error || 'Unable to extend session');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.SESSION.GET_ALL] });
      toast.success('Session extended successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to extend session');
    },
  });
}

/**
 * Hook to delete multiple sessions at once (bulk operation).
 * Used for selecting and signing out multiple sessions simultaneously.
 *
 * @returns Mutation object with mutate function and loading/error states
 *
 * @example
 * ```tsx
 * const { mutate: deleteSessions, isPending } = useDeleteSessions();
 *
 * const handleBulkSignOut = (sessionIds: string[]) => {
 *   deleteSessions(sessionIds);
 * };
 * ```
 */
export function useDeleteSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['SESSION_DELETE_BULK'],
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    mutationFn: async (sessionIds: string[]) => {
      // Lazy import to fix circular dependency if necessary, or just import at top?
      // Re-use imports from top.
      const { deleteSessions } = await import('@/actions/sessions');
      const result = await deleteSessions({ sessionIds });

      if (!result.success) {
        throw new Error(result.error || 'Unable to sign out selected sessions');
      }

      return result.data;
    },
    onSuccess: (data: { deactivatedCount: number }) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.SESSION.GET_ALL] });
      toast.success(`${data.deactivatedCount} session(s) signed out successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to sign out sessions');
    },
  });
}
