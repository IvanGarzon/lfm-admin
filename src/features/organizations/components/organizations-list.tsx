'use client';

import { useCallback, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { SearchParams } from 'nuqs/server';

import { useDataTable } from '@/hooks/use-data-table';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OrganizationsTable } from '@/features/organizations/components/organizations-table';
import { createOrganizationColumns } from '@/features/organizations/components/organization-columns';
import {
  useDeleteOrganization,
  useCreateOrganization,
  useUpdateOrganization,
} from '@/features/organizations/hooks/use-organization-queries';
import { OrganizationForm } from '@/features/organizations/components/organization-form';
import { DeleteOrganizationDialog } from '@/features/organizations/components/delete-organization-dialog';
import type { CreateOrganizationInput, UpdateOrganizationInput } from '@/schemas/organizations';
import type { OrganizationListItem, OrganizationPagination } from '@/features/organizations/types';

const DEFAULT_PAGE_SIZE = 20;

interface OrganizationsListProps {
  initialData: OrganizationPagination;
  searchParams: SearchParams;
}

export function OrganizationsList({
  initialData,
  searchParams: serverSearchParams,
}: OrganizationsListProps) {
  const perPage = Number(serverSearchParams.perPage) || DEFAULT_PAGE_SIZE;
  const pageCount = Math.ceil(initialData.pagination.totalItems / perPage);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingOrganization, setEditingOrganization] = useState<OrganizationListItem | null>(null);
  const [deletingOrganization, setDeletingOrganization] = useState<{
    id: string;
    name: string;
    customersCount: number;
  } | null>(null);
  const deleteOrganization = useDeleteOrganization();
  const { mutate: createOrganization, isPending: isCreating } = useCreateOrganization();
  const { mutate: updateOrganization, isPending: isUpdating } = useUpdateOrganization();

  const handleEdit = useCallback((organization: OrganizationListItem) => {
    setEditingOrganization(organization);
  }, []);

  const handleDelete = useCallback((id: string, name: string, customersCount: number) => {
    setDeletingOrganization({ id, name, customersCount });
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deletingOrganization) {
      deleteOrganization.mutate(
        { id: deletingOrganization.id },
        {
          onSuccess: () => {
            setDeletingOrganization(null);
          },
        },
      );
    }
  }, [deletingOrganization, deleteOrganization]);

  const columns = useMemo(
    () => createOrganizationColumns(handleDelete, handleEdit),
    [handleDelete, handleEdit],
  );

  const handleShowCreateModal = useCallback(() => {
    setShowCreateModal((prev) => !prev);
  }, []);

  const handleCreate = useCallback(
    (data: CreateOrganizationInput) => {
      createOrganization(data, {
        onSuccess: () => {
          setShowCreateModal(false);
        },
      });
    },
    [createOrganization],
  );

  const handleUpdate = useCallback(
    (data: UpdateOrganizationInput) => {
      updateOrganization(data, {
        onSuccess: () => {
          setEditingOrganization(null);
        },
      });
    },
    [updateOrganization],
  );

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
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground text-sm">Manage and track all your organizations</p>
        </Box>
        <Box className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center shrink-0">
          <Button onClick={handleShowCreateModal} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Organization
          </Button>
        </Box>
      </Box>

      <OrganizationsTable
        table={table}
        items={initialData.items}
        totalItems={initialData.pagination.totalItems}
      />

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Add a new organization to your system. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <OrganizationForm
            onCreate={handleCreate}
            isCreating={isCreating}
            onClose={() => setShowCreateModal(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingOrganization}
        onOpenChange={(open) => !open && setEditingOrganization(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>
              Update the organization details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {editingOrganization && (
            <OrganizationForm
              organization={editingOrganization}
              onUpdate={handleUpdate}
              isUpdating={isUpdating}
              onClose={() => setEditingOrganization(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <DeleteOrganizationDialog
        open={!!deletingOrganization}
        onOpenChange={(open) => !open && setDeletingOrganization(null)}
        onConfirm={handleConfirmDelete}
        organizationName={deletingOrganization?.name}
        customersCount={deletingOrganization?.customersCount}
        isPending={deleteOrganization.isPending}
      />
    </Box>
  );
}
