'use client';

import { useMemo, useState } from 'react';
import { SearchParams } from 'nuqs/server';
import { Plus } from 'lucide-react';
import { useDataTable } from '@/hooks/use-data-table';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { EmployeesTable } from '@/features/staff/employees/components/employees-table';
import { createEmployeeColumns } from '@/features/staff/employees/components/employee-columns';
import { useDeleteEmployee } from '@/features/staff/employees/hooks/use-employees';
import type { EmployeePagination } from '@/features/staff/employees/types';
import dynamic from 'next/dynamic';

const DEFAULT_PAGE_SIZE = 20;

const EmployeeDrawer = dynamic(
  () =>
    import('@/features/staff/employees/components/employee-drawer').then(
      (mod) => mod.EmployeeDrawer,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

export function EmployeesList({
  initialData,
  searchParams: serverSearchParams,
}: {
  initialData: EmployeePagination;
  searchParams: SearchParams;
}) {
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const deleteEmployee = useDeleteEmployee();

  const perPage = Number(serverSearchParams.perPage) || DEFAULT_PAGE_SIZE;
  const pageCount = Math.ceil(initialData.pagination.totalItems / perPage);

  const columns = useMemo(
    () =>
      createEmployeeColumns((id) => {
        if (confirm(`Are you sure you want to delete this employee?`)) {
          deleteEmployee.mutate(id);
        }
      }),
    [deleteEmployee],
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
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground text-sm">Manage and track all your employees</p>
        </Box>
        <Box className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center shrink-0">
          <Button onClick={handleShowCreateModal} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </Box>
      </Box>

      <EmployeesTable
        table={table}
        items={initialData.items}
        totalItems={initialData.pagination.totalItems}
      />

      {showCreateModal ? (
        <EmployeeDrawer open={showCreateModal} onClose={handleShowCreateModal} />
      ) : null}
    </Box>
  );
}
