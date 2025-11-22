'use client';

import { useSearchParams } from 'next/navigation';
import { Box } from '@/components/ui/box';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
// import { DataTableSortList } from '@/components/data-table/data-table-sort-list';

interface EmployeeTableParams<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalItems: number;
}

export function EmployeesTable<TData, TValue>({
  columns,
  data,
  totalItems,
}: EmployeeTableParams<TData, TValue>) {
  const searchParams = useSearchParams();

  // Get perPage from URL to calculate pageCount
  const perPageParam = searchParams.get('perPage');
  const perPage = perPageParam ? parseInt(perPageParam, 10) : 20;
  const pageCount = Math.ceil(totalItems / perPage);

  const { table } = useDataTable({
    data,
    columns,
    pageCount: pageCount,
    shallow: false,
    debounceMs: 500,
  });

  return (
    <Box className="flex flex-wrap items-center space-y-4 p-4 gap-4">
      <DataTable table={table} totalItems={totalItems}>
        <DataTableToolbar table={table}>
          {/* <DataTableSortList table={table} /> */}
        </DataTableToolbar>
      </DataTable>
    </Box>
  );
}
