import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { constructMetadata } from '@/lib/utils';
import { getRecipes } from '@/actions/finances/recipes/queries';
import { RecipesView } from '@/features/finances/recipes/components/recipes-view';

export const metadata = constructMetadata({
  title: 'Recipes – lfm dashboard',
  description: 'Manage your floral, craft and recipe cost calculations.',
});

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParamsResolved = await searchParams;
  const result = await getRecipes(searchParamsResolved);

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <RecipesView initialData={result.data} searchParams={searchParamsResolved} />
    </Shell>
  );
}
