'use client';

import { useMemo } from 'react';
import { useDataTable } from '@/hooks/use-data-table';
import { Box } from '@/components/ui/box';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/shared/tableV3/data-table';
import { DataTableToolbar } from '@/components/shared/tableV3/data-table-toolbar';
import { userColumns } from '@/features/admin/users/components/user-columns';
import { useAdminUsers } from '@/features/admin/users/hooks/use-user-queries';

export function UsersList() {
  const { data: users = [] } = useAdminUsers();
  const columns = useMemo(() => userColumns, []);

  const { table } = useDataTable({
    data: users,
    columns,
    pageCount: 1,
    shallow: true,
    debounceMs: 300
  });

  return (
    <Box className='space-y-4 min-w-0 w-full'>
      <Box className='mb-4'>
        <h1 className='text-3xl font-bold tracking-tight'>Users</h1>
        <p className='text-muted-foreground text-sm'>All users across all tenants</p>
      </Box>

      <Card className='flex w-full flex-col space-y-4 p-4 overflow-hidden min-w-0'>
        <DataTableToolbar table={table} />
        {users.length ? (
          <DataTable table={table} totalItems={users.length} />
        ) : (
          <Box className='text-center py-12 text-muted-foreground'>No users found.</Box>
        )}
      </Card>
    </Box>
  );
}
