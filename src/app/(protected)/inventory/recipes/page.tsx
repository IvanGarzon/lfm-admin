import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { constructMetadata } from '@/lib/utils';
import { getRecipes } from '@/actions/inventory/recipes/queries';
import { RecipesView } from '@/features/inventory/recipes/components/recipes-view';
import { getQueryClient } from '@/lib/query-client';
import { RECIPE_KEYS } from '@/features/inventory/recipes/constants/query-keys';
import { searchParamsCache } from '@/filters/recipes/recipes-filters';

export const metadata = constructMetadata({
  title: 'Recipes – lfm dashboard',
  description: 'Manage your floral, craft and recipe cost calculations.'
});

export default async function RecipesPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParamsResolved = await searchParams;
  const filters = searchParamsCache.parse(searchParamsResolved);
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: RECIPE_KEYS.list(filters),
    queryFn: async () => {
      const result = await getRecipes(filters);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    }
  });

  return (
    <Shell scrollable>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <RecipesView />
      </HydrationBoundary>
    </Shell>
  );
}
