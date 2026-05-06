'use client';

import { useMemo } from 'react';
import { useDataTable } from '@/hooks/use-data-table';
import { Box } from '@/components/ui/box';
import { RecipeTable } from '@/features/inventory/recipes/components/recipe-table';
import type { RecipePagination } from '@/features/inventory/recipes/types';
import { createRecipeColumns } from '@/features/inventory/recipes/components/recipe-columns';
import { useRecipeActions } from '@/features/inventory/recipes/context/recipe-action-context';

export function RecipeList({ data }: { data?: RecipePagination }) {
  const { openDelete, openEdit } = useRecipeActions();

  const pageCount = data?.pagination.totalPages ?? 0;

  const columns = useMemo(
    () =>
      createRecipeColumns(
        (id, name) => openDelete(id, name),
        (id) => openEdit(id)
      ),
    [openDelete, openEdit]
  );

  const { table } = useDataTable({
    data: data?.items ?? [],
    columns,
    pageCount,
    shallow: false,
    debounceMs: 500
  });

  return (
    <Box className='space-y-4 pt-2 border-none p-0 outline-none focus-visible:ring-0'>
      <RecipeTable
        table={table}
        items={data?.items ?? []}
        totalItems={data?.pagination.totalItems ?? 0}
      />
    </Box>
  );
}
