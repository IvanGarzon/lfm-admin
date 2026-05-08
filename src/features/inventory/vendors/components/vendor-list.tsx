'use client';

import { useMemo } from 'react';

import { useDataTable } from '@/hooks/use-data-table';
import { Box } from '@/components/ui/box';
import { VendorTable } from '@/features/inventory/vendors/components/vendor-table';
import { createVendorColumns } from '@/features/inventory/vendors/components/vendor-columns';
import type { VendorPagination } from '@/features/inventory/vendors/types';
import { useVendorActions } from '@/features/inventory/vendors/context/vendor-action-context';

export function VendorList({ data }: { data?: VendorPagination }) {
  const { openDelete } = useVendorActions();

  const columns = useMemo(
    () =>
      createVendorColumns({
        onDelete: (id: string, name: string) => openDelete(id, name)
      }),
    [openDelete]
  );

  const { table } = useDataTable({
    data: data?.items ?? [],
    columns,
    pageCount: data?.pagination.totalPages ?? 0,
    debounceMs: 500
  });

  return (
    <Box className='space-y-4 min-w-0 w-full'>
      <VendorTable
        table={table}
        items={data?.items ?? []}
        totalItems={data?.pagination.totalItems ?? 0}
      />
    </Box>
  );
}
