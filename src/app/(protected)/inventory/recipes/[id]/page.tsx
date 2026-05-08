import dynamic from 'next/dynamic';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { RecipesView } from '@/features/inventory/recipes/components/recipes-view';
import { getRecipes } from '@/actions/inventory/recipes/queries';
import { getQueryClient } from '@/lib/query-client';
import { RECIPE_KEYS } from '@/features/inventory/recipes/constants/query-keys';
import { searchParamsCache } from '@/filters/recipes/recipes-filters';

export const metadata = {
  title: 'Recipe Detail | Finance'
};

const RecipeDrawer = dynamic(
  () =>
    import('@/features/inventory/recipes/components/recipe-drawer').then((mod) => mod.RecipeDrawer),
  {
    loading: () => null
  }
);

export default async function RecipePage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
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
        {id ? <RecipeDrawer id={id} open={true} /> : null}
      </HydrationBoundary>
    </Shell>
  );
}
