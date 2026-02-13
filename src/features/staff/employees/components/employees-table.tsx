'use client';

import { Table } from '@tanstack/react-table';
import { Card } from '@/components/ui/card';
import { Box } from '@/components/ui/box';
import { DataTable } from '@/components/shared/tableV3/data-table';
import { DataTableToolbar } from '@/components/shared/tableV3/data-table-toolbar';
import { usePrefetchEmployee } from '@/features/staff/employees/hooks/use-employees';
import type { EmployeeListItem } from '@/features/staff/employees/types';

interface EmployeesTableProps<TData> {
  table: Table<TData>;
  items: TData[];
  totalItems: number;
}

export function EmployeesTable<TData>({ table, items, totalItems }: EmployeesTableProps<TData>) {
  const prefetchEmployee = usePrefetchEmployee();

  const handleRowHover = (employee: TData) => {
    const employeeData = employee as unknown as EmployeeListItem;
    prefetchEmployee(employeeData.id);
  };

  return (
    <Card className="flex w-full flex-col space-y-4 p-4 overflow-hidden min-w-0">
      <DataTableToolbar table={table} />
      {items.length ? (
        <DataTable table={table} totalItems={totalItems} onRowHover={handleRowHover} />
      ) : (
        <Box className="text-center py-12 text-muted-foreground">
          No employees found. Try adjusting your filters.
        </Box>
      )}
    </Card>
  );
}
