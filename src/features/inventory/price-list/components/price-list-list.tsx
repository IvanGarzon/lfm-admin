'use client';

import { useMemo } from 'react';

import { useDataTable } from '@/hooks/use-data-table';
import { Box } from '@/components/ui/box';
import { PriceListTable } from '@/features/inventory/price-list/components/price-list-table';
import { createPriceListColumns } from '@/features/inventory/price-list/components/price-list-columns';
import type { PriceListPagination } from '@/features/inventory/price-list/types';
import { usePriceListActions } from '@/features/inventory/price-list/context/price-list-action-context';

export function PriceListList({ data }: { data?: PriceListPagination }) {
  const { openDelete, openCostHistory } = usePriceListActions();

  const columns = useMemo(
    () =>
      createPriceListColumns({
        onDelete: (id: string, name: string) => openDelete(id, name),
        onViewCostHistory: (id: string, name: string) => openCostHistory(id, name)
      }),
    [openDelete, openCostHistory]
  );

  const { table } = useDataTable({
    data: data?.items ?? [],
    columns,
    pageCount: data?.pagination.totalPages ?? 0,
    debounceMs: 500
  });

  return (
    <Box className='space-y-4'>
      <PriceListTable
        table={table}
        items={data?.items ?? []}
        totalItems={data?.pagination.totalItems ?? 0}
      />
    </Box>
  );
}
