import type { RecipeFilters } from '@/features/inventory/recipes/types';

export const RECIPE_KEYS = {
  all: ['recipes'] as const,
  lists: () => [...RECIPE_KEYS.all, 'list'] as const,
  list: (filters: RecipeFilters) => [...RECIPE_KEYS.lists(), { filters }] as const,
  details: () => [...RECIPE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...RECIPE_KEYS.details(), id] as const
};
