'use client';

import { useMemo } from 'react';

import { useDataTable } from '@/hooks/use-data-table';
import { Box } from '@/components/ui/box';
import { ProductTable } from '@/features/inventory/products/components/product-table';
import { BulkActionsBar } from '@/features/inventory/products/components/bulk-actions-bar';
import { createProductColumns } from '@/features/inventory/products/components/product-columns';
import {
  useBulkDeleteProducts,
  useBulkUpdateProductStatus
} from '@/features/inventory/products/hooks/use-products-queries';
import { useProductActions } from '@/features/inventory/products/context/product-action-context';
import type { ProductPagination, ProductListItem } from '@/features/inventory/products/types';
import type { ProductStatus } from '@/prisma/client';

export function ProductList({ data }: { data?: ProductPagination }) {
  const { openDelete } = useProductActions();

  // Create columns with action handlers
  const columns = useMemo(
    () =>
      createProductColumns({
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

  const bulkDelete = useBulkDeleteProducts();
  const bulkUpdateStatus = useBulkUpdateProductStatus();

  const handleBulkDelete = (rows: ProductListItem[]) => {
    bulkDelete.mutate(
      rows.map((r) => r.id),
      {
        onSuccess: () => table.toggleAllPageRowsSelected(false)
      }
    );
  };

  const handleBulkUpdateStatus = (rows: ProductListItem[], status: ProductStatus) => {
    bulkUpdateStatus.mutate(
      { ids: rows.map((r) => r.id), status },
      {
        onSuccess: () => table.toggleAllPageRowsSelected(false)
      }
    );
  };

  return (
    <Box className='space-y-4'>
      <BulkActionsBar
        table={table}
        onUpdateStatus={handleBulkUpdateStatus}
        onDelete={handleBulkDelete}
        isPending={bulkDelete.isPending || bulkUpdateStatus.isPending}
      />
      <ProductTable
        table={table}
        items={data?.items ?? []}
        totalItems={data?.pagination.totalItems ?? 0}
      />
    </Box>
  );
}
