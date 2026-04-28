'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  skipToken,
  type QueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSessions as getSessionsAction, getSessionsByUserId } from '@/actions/sessions/queries';
import {
  deleteSession,
  deleteOtherSessions,
  deleteSessions,
  extendSession,
  adminRevokeSession,
  adminExtendSession,
  adminRevokeAllUserSessions,
} from '@/actions/sessions/mutations';
import type { SessionWithUser } from '@/features/sessions/types';
import { USER_KEYS } from '@/features/users/constants/query-keys';

const SESSION_KEYS = {
  all: ['sessions'] as const,
  lists: () => [...SESSION_KEYS.all, 'list'] as const,
  list: () => [...SESSION_KEYS.lists()] as const,
  details: () => [...SESSION_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...SESSION_KEYS.details(), id] as const,
};

function invalidateSessionQueries(queryClient: QueryClient, options?: { sessionId?: string }) {
  if (options?.sessionId) {
    queryClient.invalidateQueries({ queryKey: SESSION_KEYS.detail(options.sessionId) });
  }
  queryClient.invalidateQueries({ queryKey: SESSION_KEYS.lists() });
}

/**
 * Fetches all active sessions for the current user.
 * @returns Query result containing all active sessions
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
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Fetches a single session by ID from cache.
 * @param id - The session ID (undefined disables the query)
 * @returns Query result containing the session details
 */
export function useSession(id: string | undefined) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: SESSION_KEYS.detail(id ?? ''),
    queryFn: id
      ? async () => {
          const cachedSessions = queryClient.getQueryData<SessionWithUser[]>(SESSION_KEYS.list());
          const cachedSession = cachedSessions?.find((s) => s.id === id);
          if (cachedSession) {
            return cachedSession;
          }

          throw new Error('Session not found in cache');
        }
      : skipToken,
    staleTime: 30 * 1000,
  });
}

/**
 * Deactivates a specific session.
 * @returns Mutation hook for deactivating a session
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
 * @returns Mutation hook for deactivating other sessions
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
 * @returns Mutation hook for extending a session
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
 * Deactivates multiple sessions at once.
 * @returns Mutation hook for bulk deactivating sessions
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

// -- Admin session hooks -------------------------------------------------------

const userSessionsKey = (userId: string) => [...USER_KEYS.detail(userId), 'sessions'] as const;

/**
 * Fetches all active sessions for a specific user (admin view).
 * @param userId - The ID of the user whose sessions to fetch
 * @returns Query result containing all active sessions for the user
 */
export function useUserSessions(userId: string) {
  return useQuery({
    queryKey: userSessionsKey(userId),
    queryFn: async () => {
      const result = await getSessionsByUserId(userId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return (result.data ?? []) as SessionWithUser[];
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Revokes a specific session belonging to any user within the admin's tenant.
 * @param userId - The ID of the user whose session to revoke
 * @returns Mutation hook for revoking a user session
 */
export function useAdminRevokeUserSession(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const result = await adminRevokeSession({ sessionId });
      if (!result.success) {
        throw new Error(result.error || 'Unable to revoke session');
      }
      return result.data;
    },
    onMutate: async (sessionId) => {
      const key = userSessionsKey(userId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (old: SessionWithUser[] | undefined) =>
        old ? old.filter((s) => s.id !== sessionId) : old,
      );
      return { previous };
    },
    onError: (err: Error, _sessionId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(userSessionsKey(userId), context.previous);
      }
      toast.error(err.message || 'Failed to revoke session');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userSessionsKey(userId) });
    },
    onSuccess: () => {
      toast.success('Session revoked');
    },
  });
}

/**
 * Extends a session belonging to any user within the admin's tenant by 30 days.
 * @param userId - The ID of the user whose session to extend
 * @returns Mutation hook for extending a user session
 */
export function useAdminExtendUserSession(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const result = await adminExtendSession({ sessionId });
      if (!result.success) {
        throw new Error(result.error || 'Unable to extend session');
      }
      return result.data;
    },
    onMutate: async (sessionId) => {
      const key = userSessionsKey(userId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 30);
      queryClient.setQueryData(key, (old: SessionWithUser[] | undefined) =>
        old ? old.map((s) => (s.id === sessionId ? { ...s, expires: newExpiry } : s)) : old,
      );
      return { previous };
    },
    onError: (err: Error, _sessionId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(userSessionsKey(userId), context.previous);
      }
      toast.error(err.message || 'Failed to extend session');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userSessionsKey(userId) });
    },
    onSuccess: () => {
      toast.success('Session extended');
    },
  });
}

/**
 * Revokes all sessions for a user within the admin's tenant.
 * @param userId - The ID of the user whose sessions to revoke
 * @returns Mutation hook for revoking all sessions for a user
 */
export function useAdminRevokeAllUserSessions(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await adminRevokeAllUserSessions({ userId });
      if (!result.success) {
        throw new Error(result.error || 'Unable to revoke all sessions');
      }
      return result.data;
    },
    onMutate: async () => {
      const key = userSessionsKey(userId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, []);
      return { previous };
    },
    onError: (err: Error, _v, context) => {
      if (context?.previous) {
        queryClient.setQueryData(userSessionsKey(userId), context.previous);
      }
      toast.error(err.message || 'Failed to revoke all sessions');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userSessionsKey(userId) });
    },
    onSuccess: (data) => {
      toast.success(`${data?.revokedCount ?? 'All'} session(s) revoked`);
    },
  });
}
