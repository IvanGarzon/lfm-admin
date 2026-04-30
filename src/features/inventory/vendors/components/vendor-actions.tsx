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
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import Link from 'next/link';
import { useVendorActions } from '@/features/inventory/vendors/context/vendor-action-context';
import { useVendorHref } from '@/features/inventory/vendors/hooks/use-vendor-href';

interface VendorActionsProps {
  vendor: {
    id: string;
    vendorCode: string;
    name: string;
  };
  onDelete: (id: string, vendorCode: string, name: string) => void;
}

export function VendorActions({ vendor, onDelete }: VendorActionsProps) {
  const href = useVendorHref(vendor.id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={href}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit vendor
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => onDelete(vendor.id, vendor.vendorCode, vendor.name)}
        >
          <Trash className="h-4 w-4" aria-hidden="true" />
          Delete vendor
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
