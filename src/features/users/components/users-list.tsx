'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { SearchParams } from 'nuqs/server';
import { useDataTable } from '@/hooks/use-data-table';
import { Box } from '@/components/ui/box';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/tableV3/data-table';
import { DataTableToolbar } from '@/components/shared/tableV3/data-table-toolbar';
import { userColumns } from '@/features/users/components/user-columns';
import type { UserPagination } from '@/features/users/types';

const UserDrawer = dynamic(
  () => import('@/features/users/components/user-drawer').then((mod) => mod.UserDrawer),
  { ssr: false, loading: () => null },
);

const UserInviteModal = dynamic(
  () => import('@/features/users/components/user-invite-modal').then((mod) => mod.UserInviteModal),
  { ssr: false, loading: () => null },
);

export function UsersList({
  initialData,
  searchParams: serverSearchParams,
  openUserId,
}: {
  initialData: UserPagination;
  searchParams: SearchParams;
  openUserId?: string;
}) {
  const [showInviteModal, setShowInviteModal] = useState(false);

  const perPage = Number(serverSearchParams.perPage) || 20;
  const pageCount = Math.ceil(initialData.pagination.totalItems / perPage);

  const columns = useMemo(() => userColumns, []);

  const { table } = useDataTable({
    data: initialData.items,
    columns,
    pageCount,
    shallow: false,
    debounceMs: 500,
  });

  return (
    <Box className="space-y-4 min-w-0 w-full">
      <Box className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <Box className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground text-sm">Manage users and their access</p>
        </Box>
        <Box className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center shrink-0">
          <Button onClick={() => setShowInviteModal(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        </Box>
      </Box>

      <Card className="flex w-full flex-col space-y-4 p-4 overflow-hidden min-w-0">
        <DataTableToolbar table={table} />
        {initialData.items.length ? (
          <DataTable table={table} totalItems={initialData.pagination.totalItems} />
        ) : (
          <Box className="text-center py-12 text-muted-foreground">No users found.</Box>
        )}
      </Card>

      {openUserId ? <UserDrawer id={openUserId} /> : null}

      <UserInviteModal open={showInviteModal} onOpenChange={setShowInviteModal} />
    </Box>
  );
}
