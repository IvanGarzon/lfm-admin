'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { SearchParams } from 'nuqs/server';
import { Plus } from 'lucide-react';

import { useDataTable } from '@/hooks/use-data-table';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { CustomersTable } from '@/features/customers/components/customers-table';
import { createCustomerColumns } from '@/features/customers/components/customer-columns';
import { useDeleteCustomer } from '@/features/customers/hooks/use-customer-queries';
import type { CustomerPagination } from '@/features/customers/types';

const DEFAULT_PAGE_SIZE = 20;

interface CustomerViewProps {
  initialData: CustomerPagination;
  searchParams: SearchParams;
}

const CustomerDrawer = dynamic(
  () => import('@/features/customers/components/customer-drawer').then((mod) => mod.CustomerDrawer),
  {
    ssr: false,
    loading: () => null,
  },
);

export function CustomersList({
  initialData,
  searchParams: serverSearchParams,
}: CustomerViewProps) {
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const deleteCustomer = useDeleteCustomer();

  const perPage = Number(serverSearchParams.perPage) || DEFAULT_PAGE_SIZE;
  const pageCount = Math.ceil(initialData.pagination.totalItems / perPage);

  const columns = useMemo(
    () =>
      createCustomerColumns((id, name) => {
        if (confirm(`Are you sure you want to delete ${name}?`)) {
          deleteCustomer.mutate({ id });
        }
      }),
    [deleteCustomer],
  );

  const handleShowCreateModal = () => {
    setShowCreateModal((prev) => !prev);
  };

  const { table } = useDataTable({
    data: initialData.items,
    columns,
    pageCount: pageCount,
    shallow: false,
    debounceMs: 500,
  });

  return (
    <Box className="space-y-4 min-w-0 w-full">
      <Box className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <Box className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground text-sm">Manage and track all your customers</p>
        </Box>
        <Box className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center shrink-0">
          <Button onClick={handleShowCreateModal} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </Box>
      </Box>

      <CustomersTable
        table={table}
        items={initialData.items}
        totalItems={initialData.pagination.totalItems}
      />

      {showCreateModal ? (
        <CustomerDrawer open={showCreateModal} onClose={handleShowCreateModal} />
      ) : null}
    </Box>
  );
}
