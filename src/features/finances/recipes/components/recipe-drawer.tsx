'use client';

import { useCallback, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { X, AlertCircle, Calculator, Save, MoreHorizontal, Trash, Loader2 } from 'lucide-react';

import { Box } from '@/components/ui/box';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useRecipe,
  useCreateRecipe,
  useUpdateRecipe,
  useDeleteRecipe,
} from '@/features/finances/recipes/hooks/use-recipe-queries';
import { RecipeForm } from './recipe-form';
import { RecipeDrawerSkeleton } from './recipe-drawer-skeleton';
import { useQueryString } from '@/hooks/use-query-string';
import { searchParams, recipeSearchParamsDefaults } from '@/filters/recipes/recipes-filters';
import { CopyButton } from '@/components/shared/copy-button';
import type { CreateRecipeInput, UpdateRecipeInput } from '@/schemas/recipes';

type DrawerMode = 'view' | 'edit' | 'create';

export function RecipeDrawer({
  id,
  open,
  onClose,
}: {
  id?: string;
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isEditing] = useState<boolean>(true);

  const { data: recipe, isLoading, isError, error } = useRecipe(id);

  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();

  const queryString = useQueryString(searchParams, recipeSearchParamsDefaults);

  const mode: DrawerMode = id ? (isEditing ? 'edit' : 'view') : 'create';
  const isOpen = id ? (pathname?.includes(`/finances/recipes/${id}`) ?? false) : (open ?? false);

  const handleOpenChange = useCallback(
    (openState: boolean) => {
      if (!openState) {
        setHasUnsavedChanges(false);

        if (id) {
          const basePath = '/finances/recipes';
          const targetPath = queryString ? `${basePath}?${queryString}` : basePath;
          router.push(targetPath);
        } else {
          onClose?.();
        }
      }
    },
    [id, onClose, router, queryString],
  );

  const handleCreate = useCallback(
    (data: CreateRecipeInput) => {
      createRecipe.mutate(data, {
        onSuccess: () => {
          handleOpenChange(false);
        },
      });
    },
    [createRecipe, handleOpenChange],
  );

  const handleUpdate = useCallback(
    (data: UpdateRecipeInput) => {
      if (!id) return;
      updateRecipe.mutate(
        { id, data },
        {
          onSuccess: () => {
            setHasUnsavedChanges(false);
          },
        },
      );
    },
    [updateRecipe, id],
  );

  const handleDelete = useCallback(() => {
    if (!id) return;
    if (confirm(`Are you sure you want to delete this recipe?`)) {
      deleteRecipe.mutate(id, {
        onSuccess: () => {
          handleOpenChange(false);
        },
      });
    }
  }, [deleteRecipe, id, handleOpenChange]);

  const getTitle = () => {
    if (mode === 'create') {
      return 'New Recipe';
    }

    return recipe?.name || 'Edit Recipe';
  };

  return (
    <Drawer open={isOpen} modal={true} onOpenChange={handleOpenChange}>
      <DrawerContent
        className="overflow-x-hidden dark:bg-gray-925 pb-0!"
        style={{ maxWidth: '1100px' }}
      >
        {isLoading ? <RecipeDrawerSkeleton /> : null}

        {isError ? (
          <>
            <DrawerHeader>
              <DrawerTitle>Error</DrawerTitle>
            </DrawerHeader>
            <Box className="p-6 text-destructive">
              <p className="mt-4">Could not load recipe details: {error?.message}</p>
            </Box>
          </>
        ) : null}

        {!isLoading && !isError ? (
          <>
            <Box className="-mx-6 flex items-center justify-between gap-x-4 border-b border-gray-200 px-6 pb-4 dark:border-gray-900 shadow-sm">
              <Box className="mt-1 flex flex-row items-center gap-4 flex-1 text-wrap break-all min-w-0">
                <Box className="size-12 flex items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 shadow-inner">
                  <Calculator className="size-6" />
                </Box>
                <Box className="flex flex-col min-w-0">
                  <Box className="flex items-center gap-2 flex-wrap">
                    <DrawerTitle className="text-xl font-semibold tracking-tight truncate max-w-[300px] md:max-w-[500px]">
                      {getTitle()}
                    </DrawerTitle>
                    {isEditing && hasUnsavedChanges ? (
                      <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-500 bg-amber-50 dark:bg-amber-900/20 whitespace-nowrap shadow-sm animate-in fade-in slide-in-from-left-1">
                        <AlertCircle className="h-3 w-3" />
                        Unsaved changes
                      </span>
                    ) : null}
                  </Box>
                  <Box className="flex items-center gap-2 mt-1">
                    {recipe ? (
                      <Box className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full border border-border/40 transition-colors hover:bg-muted">
                        <span>{recipe.id}</span>
                        <CopyButton
                          value={recipe.id}
                          className="size-3 p-0 border-none hover:text-primary transition-colors"
                        />
                      </Box>
                    ) : null}
                  </Box>
                </Box>
              </Box>

              <Box className="flex items-center gap-2 shrink-0">
                <Button
                  type="submit"
                  form="form-rhf-recipe"
                  size="sm"
                  disabled={createRecipe.isPending || updateRecipe.isPending || !hasUnsavedChanges}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {mode === 'create' ? 'Save' : 'Update'}
                </Button>

                {mode !== 'create' ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shadow-sm border-gray-200 dark:border-gray-800"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-destructive focus:text-destructive cursor-pointer"
                      >
                        <Trash className="h-4 w-4" />
                        Delete recipe
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}

                <Button
                  variant="ghost"
                  className="aspect-square p-1 text-gray-500 hover:bg-gray-100 hover:dark:bg-gray-400/10"
                  onClick={() => handleOpenChange(false)}
                >
                  <X className="size-5" aria-hidden="true" />
                  <span className="sr-only">Close</span>
                </Button>
              </Box>
            </Box>

            <DrawerBody className="py-0! -mx-6 h-full overflow-hidden bg-gray-50/30 dark:bg-transparent">
              <RecipeForm
                recipe={mode === 'create' ? null : recipe}
                onCreate={handleCreate}
                onUpdate={handleUpdate}
                isCreating={createRecipe.isPending}
                isUpdating={updateRecipe.isPending}
                onDirtyStateChange={setHasUnsavedChanges}
              />
            </DrawerBody>
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
