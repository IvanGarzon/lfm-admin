'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { SearchParams } from 'nuqs/server';

import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { RecipeList } from '@/features/finances/recipes/components/recipe-list';
import { RecipeActionProvider } from '@/features/finances/recipes/context/recipe-action-context';
import type { RecipePagination } from '@/features/finances/recipes/types';

interface RecipesViewProps {
  initialData: RecipePagination;
  searchParams: SearchParams;
  recipeId?: string;
}

const RecipeDrawer = dynamic(
  () =>
    import('@/features/finances/recipes/components/recipe-drawer').then((mod) => mod.RecipeDrawer),
  {
    ssr: false,
    loading: () => null,
  },
);

export function RecipesView({ initialData, searchParams, recipeId }: RecipesViewProps) {
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  const handleShowCreateModal = () => {
    setShowCreateModal((prev) => !prev);
  };

  return (
    <RecipeActionProvider>
      <Box className="space-y-4 min-w-0 w-full">
        <Box className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <Box className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">Recipes</h1>
            <p className="text-muted-foreground text-sm">Floral & Craft Cost Calculator</p>
          </Box>
          <Box className="flex items-center shrink-0">
            <Button onClick={handleShowCreateModal} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Recipe
            </Button>
          </Box>
        </Box>

        <Box className="space-y-4 pt-2 border-none p-0 outline-none focus-visible:ring-0">
          <RecipeList initialData={initialData} searchParams={searchParams} />
        </Box>

        {showCreateModal && <RecipeDrawer open={showCreateModal} onClose={handleShowCreateModal} />}

        {recipeId && <RecipeDrawer id={recipeId} />}
      </Box>
    </RecipeActionProvider>
  );
}
