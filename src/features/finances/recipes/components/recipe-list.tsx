'use client';

import { useMemo } from 'react';
import { SearchParams } from 'nuqs/server';
import { useDataTable } from '@/hooks/use-data-table';
import { Box } from '@/components/ui/box';
import { RecipeTable } from '@/features/finances/recipes/components/recipe-table';
import type { RecipePagination } from '@/features/finances/recipes/types';
import { createRecipeColumns } from '@/features/finances/recipes/components/recipe-columns';
import { useRecipeActions } from '@/features/finances/recipes/context/recipe-action-context';

const DEFAULT_PAGE_SIZE = 20;

interface RecipesListProps {
  initialData: RecipePagination;
  searchParams: SearchParams;
}

export function RecipeList({ initialData, searchParams: serverSearchParams }: RecipesListProps) {
  const { openDelete, openEdit } = useRecipeActions();

  const perPage = Number(serverSearchParams.perPage) || DEFAULT_PAGE_SIZE;
  const pageCount = Math.ceil(initialData.pagination.totalItems / perPage);

  const columns = useMemo(
    () =>
      createRecipeColumns(
        (id, name) => openDelete(id, name),
        (id) => openEdit(id),
      ),
    [openDelete, openEdit],
  );

  const { table } = useDataTable({
    data: initialData.items,
    columns,
    pageCount: pageCount,
    shallow: false,
    debounceMs: 500,
  });

  return (
    <Box className="space-y-4 pt-2 border-none p-0 outline-none focus-visible:ring-0">
      <RecipeTable
        table={table}
        items={initialData.items}
        totalItems={initialData.pagination.totalItems}
      />
    </Box>
  );
}
