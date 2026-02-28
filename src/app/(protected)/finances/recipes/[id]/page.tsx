import { SearchParams } from 'nuqs/server';
import { getRecipes } from '@/actions/finances/recipes/queries';
import { RecipesView } from '@/features/finances/recipes/components/recipes-view';

export const metadata = {
  title: 'Recipe Detail | Finance',
};

export default async function RecipePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const sParams = await searchParams;
  const recipes = await getRecipes(sParams);

  if (!recipes.success) {
    throw new Error(recipes.error);
  }

  return <RecipesView initialData={recipes.data} searchParams={sParams} recipeId={id} />;
}
