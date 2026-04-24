'use client';

import { Table } from '@tanstack/react-table';
import { Card } from '@/components/ui/card';
import { Box } from '@/components/ui/box';
import { DataTable } from '@/components/shared/tableV3/data-table';
import { DataTableToolbar } from '@/components/shared/tableV3/data-table-toolbar';
import { usePrefetchTenantUser } from '@/features/users/hooks/use-user-queries';
import type { UserListItem } from '@/features/users/types';

interface UsersTableProps<TData> {
  table: Table<TData>;
  items: TData[];
  totalItems: number;
}

export function UsersTable<TData>({ table, items, totalItems }: UsersTableProps<TData>) {
  const prefetchTenantUser = usePrefetchTenantUser();

  const handleRowHover = (user: TData) => {
    const userData = user as unknown as UserListItem;
    prefetchTenantUser(userData.id);
  };

  return (
    <Card className="flex w-full flex-col space-y-4 p-4 overflow-hidden min-w-0">
      <DataTableToolbar table={table} />
      {items.length ? (
        <DataTable table={table} totalItems={totalItems} onRowHover={handleRowHover} />
      ) : (
        <Box className="text-center py-12 text-muted-foreground">
          No users found. Try adjusting your filters.
        </Box>
      )}
    </Card>
  );
}
