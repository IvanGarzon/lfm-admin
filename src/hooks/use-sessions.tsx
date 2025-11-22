import { z } from 'zod';
import {
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
  QueryFunction,
} from '@tanstack/react-query';
import { Session } from '@/prisma/client';

// Query keys as constants
export const QueryKeys = {
  SESSION: {
    GET_ALL: 'SESSIONS_GET_ALL',
    GET_BY_ID: 'SESSION_GET_BY_ID',
  },
};

// export const MutationKeys = {
//   EMPLOYEE: {
//     CREATE: 'EMPLOYEE_CREATE',
//     UPDATE: 'EMPLOYEE_UPDATE',
//     DELETE: 'EMPLOYEE_DELETE',
//   },
// };

// Create a type that's compatible with both useQuery and useSuspenseQuery
type QueryOptions<T, E = Error> = {
  queryKey: readonly [string, {}];
  queryFn: QueryFunction<T, readonly [string, {}], E>;
  placeholderData?: (previousData: T | undefined) => T | undefined;
  initialData?: () => T | undefined;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
};

export const getSessions = (queryParams: {}): Pick<
  QueryOptions<Session, Error>,
  'queryKey' | 'queryFn'
> => {
  return {
    queryKey: [QueryKeys.SESSION.GET_ALL, queryParams] as const,
    queryFn: async () => {
      const url = `/api/sessions`;
      const response = await fetch(url, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }

      return response.json();
    },
  };
};

// Get all employees hook
export function useSessions(params: {}): QueryOptions<Session, Error> {
  const queryClient = useQueryClient();

  return {
    ...getSessions({}),
    placeholderData: (previousData) => previousData,
    initialData: () => queryClient.getQueryData<Session>([QueryKeys.SESSION.GET_ALL]) || undefined,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  };
}
