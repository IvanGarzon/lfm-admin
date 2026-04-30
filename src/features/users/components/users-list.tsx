'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState, useCallback } from 'react';
import { Plus, Users } from 'lucide-react';
import { SearchParams } from 'nuqs/server';
import { useDataTable } from '@/hooks/use-data-table';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { userColumns } from '@/features/users/components/user-columns';
import { EmptyState } from '@/components/shared/empty-state';
import { UsersTable } from '@/features/users/components/users-table';
import { hasActiveSearchFilters } from '@/lib/utils';
import { searchParams as userSearchParams } from '@/filters/users/users-filters';
import { useUsers } from '@/features/users/hooks/use-user-queries';

const DEFAULT_PAGE_SIZE = 20;

const UserDrawer = dynamic(
  () => import('@/features/users/components/user-drawer').then((mod) => mod.UserDrawer),
  {
    ssr: false,
    loading: () => null,
  },
);

const UserInviteModal = dynamic(
  () => import('@/features/users/components/user-invite-modal').then((mod) => mod.UserInviteModal),
  {
    ssr: false,
    loading: () => null,
  },
);

export function UsersList({ searchParams: serverSearchParams }: { searchParams: SearchParams }) {
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);

  const { data } = useUsers(serverSearchParams);

  const perPage = Number(serverSearchParams.perPage) || DEFAULT_PAGE_SIZE;
  const pageCount = data ? Math.ceil(data.pagination.totalItems / perPage) : 0;

  const handleShowCreateModal = useCallback(() => {
    setShowCreateModal((prev) => !prev);
  }, []);

  const handleShowInviteModal = useCallback(() => {
    setShowInviteModal((prev) => !prev);
  }, []);

  const columns = useMemo(() => userColumns, []);

  const { table } = useDataTable({
    data: data?.items ?? [],
    columns,
    pageCount,
    shallow: false,
    debounceMs: 500,
  });

  const isZeroState =
    (data?.pagination.totalItems ?? 0) === 0 &&
    !hasActiveSearchFilters(serverSearchParams, userSearchParams);

  return (
    <Box className="space-y-4 min-w-0 w-full">
      {isZeroState ? (
        <EmptyState
          icon={Users}
          title="No users yet"
          description="Invite your first user to start managing team access."
          action={
            <Button onClick={handleShowInviteModal} className="w-full sm:w-auto">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Invite User
            </Button>
          }
        />
      ) : (
        <>
          <Box className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <Box className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight">Users</h1>
              <p className="text-muted-foreground text-sm">Manage users and their access</p>
            </Box>
            <Box className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center shrink-0">
              <Button onClick={handleShowInviteModal} className="w-full sm:w-auto">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Invite User
              </Button>
            </Box>
          </Box>

          <UsersTable
            table={table}
            items={data?.items ?? []}
            totalItems={data?.pagination.totalItems ?? 0}
          />
        </>
      )}

      {showCreateModal ? (
        <UserDrawer open={showCreateModal} onClose={handleShowCreateModal} />
      ) : null}

      {showInviteModal ? (
        <UserInviteModal open={showInviteModal} onOpenChange={handleShowInviteModal} />
      ) : null}
    </Box>
  );
}
