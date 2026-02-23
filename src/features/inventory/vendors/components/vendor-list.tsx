'use client';

import { useMemo } from 'react';
import { SearchParams } from 'nuqs/server';

import { useDataTable } from '@/hooks/use-data-table';
import { Box } from '@/components/ui/box';
import { VendorTable } from './vendor-table';
import { createVendorColumns } from './vendor-columns';
import { useVendorActions } from '@/features/inventory/vendors/context/vendor-action-context';
import type { VendorPagination, VendorListItem } from '@/features/inventory/vendors/types';

interface VendorListProps {
  initialData: VendorPagination;
  searchParams: SearchParams;
}

export function VendorList({ initialData, searchParams }: VendorListProps) {
  const { openDelete } = useVendorActions();

  // Create columns with action handlers
  const columns = useMemo(
    () =>
      createVendorColumns({
        onDelete: (id: string, vendorCode: string, name: string) =>
          openDelete(id, vendorCode, name),
      }),
    [openDelete],
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
    <Box className="space-y-4 min-w-0 w-full">
      <VendorTable
        table={table}
        items={initialData.items}
        totalItems={initialData.pagination.totalItems}
      />
    </Box>
  );
}
