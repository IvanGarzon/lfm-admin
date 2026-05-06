'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Plus, Layers, BookOpen } from 'lucide-react';
import { useQueryStates } from 'nuqs';

import { EmptyState } from '@/components/shared/empty-state';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { hasActiveSearchFilters } from '@/lib/utils';
import { searchParams as recipeSearchParams } from '@/filters/recipes/recipes-filters';
import { RecipeList } from '@/features/inventory/recipes/components/recipe-list';
import { useRecipes } from '@/features/inventory/recipes/hooks/use-recipe-queries';
import { CreateRecipeGroupDialog } from '@/features/inventory/recipe-groups/components/create-recipe-group-dialog';
import { useCreateRecipeGroup } from '@/features/inventory/recipe-groups/hooks/use-recipe-group-mutations';
import type { CreateRecipeGroupInput } from '@/schemas/recipe-groups';

const RecipeDrawer = dynamic(
  () =>
    import('@/features/inventory/recipes/components/recipe-drawer').then((mod) => mod.RecipeDrawer),
  {
    ssr: false,
    loading: () => null
  }
);

export function RecipesView() {
  const [currentParams] = useQueryStates(recipeSearchParams);
  const { data } = useRecipes(currentParams);

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showGroupDialog, setShowGroupDialog] = useState<boolean>(false);

  const createGroupMutation = useCreateRecipeGroup();

  const handleShowCreateModal = () => {
    setShowCreateModal((prev) => !prev);
  };

  const handleCreateGroup = async (input: CreateRecipeGroupInput) => {
    const result = await createGroupMutation.mutateAsync(input);
    if (result.success) {
      setShowGroupDialog(false);
    }
  };

  const isZeroState =
    data?.pagination.totalItems === 0 && !hasActiveSearchFilters(currentParams, recipeSearchParams);

  return (
    <Box className='space-y-4 min-w-0 w-full'>
      {isZeroState ? (
        <EmptyState
          icon={BookOpen}
          title='No recipes yet'
          description='Create your first recipe to start calculating floral and craft costs.'
          action={
            <Button onClick={handleShowCreateModal}>
              <Plus aria-hidden='true' className='h-4 w-4' />
              New Recipe
            </Button>
          }
        />
      ) : (
        <>
          <Box className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4'>
            <Box className='min-w-0'>
              <h1 className='text-3xl font-bold tracking-tight'>Recipes</h1>
              <p className='text-muted-foreground text-sm'>Floral & Craft Cost Calculator</p>
            </Box>
            <Box className='flex items-center gap-2 shrink-0'>
              <Button
                variant='outline'
                onClick={() => setShowGroupDialog(true)}
                className='w-full sm:w-auto'
              >
                <Layers aria-hidden='true' className='h-4 w-4' />
                Create Group
              </Button>
              <Button onClick={handleShowCreateModal} className='w-full sm:w-auto'>
                <Plus aria-hidden='true' className='h-4 w-4' />
                New Recipe
              </Button>
            </Box>
          </Box>

          <Box className='space-y-4 pt-2 border-none p-0 outline-none focus-visible:ring-0'>
            <RecipeList data={data} />
          </Box>
        </>
      )}

      {showCreateModal ? (
        <RecipeDrawer open={showCreateModal} onClose={handleShowCreateModal} />
      ) : null}

      <CreateRecipeGroupDialog
        open={showGroupDialog}
        onOpenChange={setShowGroupDialog}
        onCreate={handleCreateGroup}
        isCreating={createGroupMutation.isPending}
      />
    </Box>
  );
}
