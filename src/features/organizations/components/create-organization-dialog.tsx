'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Box } from '@/components/ui/box';
import { type CreateOrganizationInput } from '@/schemas/organizations';
import { useCreateOrganization } from '@/features/organizations/hooks/use-organization-queries';
import { OrganizationForm } from './organization-form';

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (organizationId: string, organizationName: string) => void;
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateOrganizationDialogProps) {
  const createOrganization = useCreateOrganization();

  const handleCreate = (data: CreateOrganizationInput) => {
    createOrganization.mutate(data, {
      onSuccess: (result) => {
        if (result.success) {
          onOpenChange(false);
          onSuccess?.(result.data.id, result.data.name);
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Add New Organization</DialogTitle>
          <DialogDescription>
            Create a new organization. Required fields are marked with (*).
          </DialogDescription>
        </DialogHeader>
        <Box className="max-h-[80vh] overflow-y-auto">
          <OrganizationForm onCreate={handleCreate} isCreating={createOrganization.isPending} />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
