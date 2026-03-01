'use client';

import { useMemo } from 'react';
import { SearchParams } from 'nuqs/server';

import { useDataTable } from '@/hooks/use-data-table';
import { Box } from '@/components/ui/box';
import { PriceListTable } from '@/features/inventory/price-list/components/price-list-table';
import { createPriceListColumns } from '@/features/inventory/price-list/components/price-list-columns';
import { usePriceListActions } from '@/features/inventory/price-list/context/price-list-action-context';
import type {
  PriceListPagination,
  PriceListItemListItem,
} from '@/features/inventory/price-list/types';

interface PriceListListProps {
  initialData: PriceListPagination;
  searchParams: SearchParams;
}

export function PriceListList({ initialData, searchParams }: PriceListListProps) {
  const { openDelete, openCostHistory } = usePriceListActions();

  const columns = useMemo(
    () =>
      createPriceListColumns({
        onDelete: (id: string, name: string) => openDelete(id, name),
        onViewCostHistory: (id: string, name: string) => openCostHistory(id, name),
      }),
    [openDelete, openCostHistory],
  );

  const perPage = searchParams.perPage ? Number(searchParams.perPage) : 20;

  const { table } = useDataTable({
    data: initialData.items,
    columns,
    pageCount: Math.ceil(initialData.pagination.totalItems / perPage),
    shallow: false,
    debounceMs: 500,
  });

  return (
    <Box className="space-y-4">
      <PriceListTable
        table={table}
        items={initialData.items}
        totalItems={initialData.pagination.totalItems}
      />
    </Box>
  );
}
