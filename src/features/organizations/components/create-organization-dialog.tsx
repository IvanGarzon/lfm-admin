'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { type CreateOrganizationInput } from '@/schemas/organizations';
import { useCreateOrganization } from '@/features/organizations/hooks/use-organization-queries';
import { OrganizationForm } from './organization-form';

export function CreateOrganizationDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (organizationId: string, organizationName: string) => void;
}) {
  const createOrganization = useCreateOrganization();

  const handleCreate = (data: CreateOrganizationInput) => {
    createOrganization.mutate(data, {
      onSuccess: (result) => {
        onOpenChange(false);
        onSuccess?.(result.id, result.name);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-w-[95vw] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Add New Organization</DialogTitle>
          <DialogDescription>
            Create a new organization. Required fields are marked with (*).
          </DialogDescription>
        </DialogHeader>
        <OrganizationForm onCreate={handleCreate} isCreating={createOrganization.isPending} />
      </DialogContent>
    </Dialog>
  );
}
