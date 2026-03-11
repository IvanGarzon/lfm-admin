import dynamic from 'next/dynamic';
import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { RecipesView } from '@/features/finances/recipes/components/recipes-view';
import { getRecipes } from '@/actions/finances/recipes/queries';

export const metadata = {
  title: 'Recipe Detail | Finance',
};

const RecipeDrawer = dynamic(
  () =>
    import('@/features/finances/recipes/components/recipe-drawer').then((mod) => mod.RecipeDrawer),
  {
    loading: () => null,
  },
);

export default async function RecipePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const searchParamsResolved = await searchParams;
  const recipes = await getRecipes(searchParamsResolved);

  if (!recipes.success) {
    throw new Error(recipes.error);
  }

  return (
    <Shell scrollable>
      <RecipesView initialData={recipes.data} searchParams={searchParamsResolved} />;
      {id ? <RecipeDrawer id={id} open={true} /> : null}
    </Shell>
  );
}
