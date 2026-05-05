import type { UserFilters } from '@/features/users/types';

export const USER_KEYS = {
  all: ['users'] as const,
  lists: () => [...USER_KEYS.all, 'list'] as const,
  list: (filters: UserFilters) => [...USER_KEYS.lists(), { filters }] as const,
  details: () => [...USER_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...USER_KEYS.details(), id] as const,
  accessChanges: (id: string) => [...USER_KEYS.detail(id), 'access-changes'] as const
};
