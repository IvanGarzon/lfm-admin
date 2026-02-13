'use client';

import { useMemo } from 'react';
import { SearchParams } from 'nuqs/server';

import { useDataTable } from '@/hooks/use-data-table';
import { Box } from '@/components/ui/box';
import { ProductTable } from '@/features/inventory/products/components/product-table';
import { BulkActionsBar } from '@/features/inventory/products/components/bulk-actions-bar';
import { createProductColumns } from '@/features/inventory/products/components/product-columns';
import {
  useBulkDeleteProducts,
  useBulkUpdateProductStatus,
} from '@/features/inventory/products/hooks/use-products-queries';
import { useProductActions } from '@/features/inventory/products/context/product-action-context';
import type { ProductPagination, ProductListItem } from '@/features/inventory/products/types';
import type { ProductStatus } from '@/prisma/client';

interface ProductListProps {
  initialData: ProductPagination;
  searchParams: SearchParams;
}

export function ProductList({ initialData, searchParams }: ProductListProps) {
  const { openDelete } = useProductActions();

  // Create columns with action handlers
  const columns = useMemo(
    () =>
      createProductColumns({
        onDelete: (id: string, name: string) => openDelete(id, name),
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

  const bulkDelete = useBulkDeleteProducts();
  const bulkUpdateStatus = useBulkUpdateProductStatus();

  const handleBulkDelete = (rows: ProductListItem[]) => {
    bulkDelete.mutate(
      rows.map((r) => r.id),
      {
        onSuccess: () => table.toggleAllPageRowsSelected(false),
      },
    );
  };

  const handleBulkUpdateStatus = (rows: ProductListItem[], status: ProductStatus) => {
    bulkUpdateStatus.mutate(
      { ids: rows.map((r) => r.id), status },
      {
        onSuccess: () => table.toggleAllPageRowsSelected(false),
      },
    );
  };

  return (
    <Box className="space-y-4">
      <BulkActionsBar
        table={table}
        onUpdateStatus={handleBulkUpdateStatus}
        onDelete={handleBulkDelete}
        isPending={bulkDelete.isPending || bulkUpdateStatus.isPending}
      />
      <ProductTable
        table={table}
        items={initialData.items}
        totalItems={initialData.pagination.totalItems}
      />
    </Box>
  );
}
