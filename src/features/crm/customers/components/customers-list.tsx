'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState, useCallback } from 'react';
import { SearchParams } from 'nuqs/server';
import { Plus, Users } from 'lucide-react';
import { useDataTable } from '@/hooks/use-data-table';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { EmptyState } from '@/components/shared/empty-state';
import { CustomersTable } from '@/features/crm/customers/components/customers-table';
import { createCustomerColumns } from '@/features/crm/customers/components/customer-columns';
import {
  useDeleteCustomer,
  useCustomers,
} from '@/features/crm/customers/hooks/use-customer-queries';
import { searchParams as customerSearchParams } from '@/filters/customers/customers-filters';
import { hasActiveSearchFilters } from '@/lib/utils';

const DEFAULT_PAGE_SIZE = 20;

const CustomerDrawer = dynamic(
  () =>
    import('@/features/crm/customers/components/customer-drawer').then((mod) => mod.CustomerDrawer),
  {
    ssr: false,
    loading: () => null,
  },
);

export function CustomersList({
  searchParams: serverSearchParams,
}: {
  searchParams: SearchParams;
}) {
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const deleteCustomer = useDeleteCustomer();

  const { data } = useCustomers(serverSearchParams);

  const perPage = Number(serverSearchParams.perPage) || DEFAULT_PAGE_SIZE;
  const pageCount = data ? Math.ceil(data.pagination.totalItems / perPage) : 0;

  const columns = useMemo(
    () =>
      createCustomerColumns((id, name) => {
        // TODO: add modal dialog instead
        if (confirm(`Are you sure you want to delete ${name}?`)) {
          deleteCustomer.mutate({ id });
        }
      }),
    [deleteCustomer],
  );

  const handleShowCreateModal = useCallback(() => {
    setShowCreateModal((prev) => !prev);
  }, []);

  const { table } = useDataTable({
    data: data?.items ?? [],
    columns,
    pageCount,
    shallow: false,
    debounceMs: 500,
  });

  const isZeroState =
    (data?.pagination.totalItems ?? 0) === 0 &&
    !hasActiveSearchFilters(serverSearchParams, customerSearchParams);

  return (
    <Box className="space-y-4 min-w-0 w-full">
      {!isZeroState ? (
        <Box className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <Box className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground text-sm">Manage and track all your customers</p>
          </Box>
          <Box className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center shrink-0">
            <Button onClick={handleShowCreateModal} className="w-full sm:w-auto">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Customer
            </Button>
          </Box>
        </Box>
      ) : null}

      {isZeroState ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Add your first customer to start managing your relationships."
          action={
            <Button onClick={handleShowCreateModal}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Customer
            </Button>
          }
        />
      ) : (
        <CustomersTable
          table={table}
          items={data?.items ?? []}
          totalItems={data?.pagination.totalItems ?? 0}
        />
      )}

      {showCreateModal ? (
        <CustomerDrawer open={showCreateModal} onClose={handleShowCreateModal} />
      ) : null}
    </Box>
  );
}
