'use client';

import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { OrganizationListItem } from '@/features/organizations/types';

export function OrganizationActions({
  organization,
  onDelete,
  onEdit,
}: {
  organization: OrganizationListItem;
  onDelete: (id: string, name: string, customersCount: number) => void;
  onEdit?: (organization: OrganizationListItem) => void;
}) {
  const handleEdit = () => {
    if (onEdit) {
      onEdit(organization);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Organization
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => onDelete(organization.id, organization.name, organization.customersCount)}
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete Organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
