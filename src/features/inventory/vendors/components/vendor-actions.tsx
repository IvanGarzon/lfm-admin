'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useVendorActions } from '@/features/inventory/vendors/context/vendor-action-context';

interface VendorActionsProps {
  vendor: {
    id: string;
    vendorCode: string;
    name: string;
  };
  onEdit?: () => void;
}

export function VendorActions({ vendor, onEdit }: VendorActionsProps) {
  const router = useRouter();
  const { openDelete } = useVendorActions();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => router.push(`/inventory/vendors/${vendor.id}`)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => openDelete(vendor.id, vendor.vendorCode, vendor.name)}
          className="text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
