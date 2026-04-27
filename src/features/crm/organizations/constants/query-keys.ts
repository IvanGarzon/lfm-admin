export const ORGANIZATION_KEYS = {
  all: ['organizations'] as const,
  lists: () => [...ORGANIZATION_KEYS.all, 'list'] as const,
  list: (filters: string) => [...ORGANIZATION_KEYS.lists(), { filters }] as const,
  details: () => [...ORGANIZATION_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...ORGANIZATION_KEYS.details(), id] as const,
};
