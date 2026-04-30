'use client';

import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { CustomerListItem } from '@/features/crm/customers/types';
import Link from 'next/link';
import { useQueryString } from '@/hooks/use-query-string';
import { customerSearchParamsDefaults, searchParams } from '@/filters/customers/customers-filters';

export function CustomerActions({
  customer,
  onDelete,
}: {
  customer: CustomerListItem;
  onDelete: (id: string, name: string) => void;
}) {
  const queryString = useQueryString(searchParams, customerSearchParamsDefaults);
  const basePath = `/crm/customers/${customer.id}`;
  const href = queryString ? `${basePath}?${queryString}` : basePath;

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
        <DropdownMenuItem asChild>
          <Link href={href} className="flex items-center">
            <Pencil className="h-4 w-4" aria-hidden="true" />
            View customer
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive hover:text-destructive"
          onClick={() => onDelete(customer.id, `${customer.firstName} ${customer.lastName}`)}
        >
          <Trash className="h-4 w-4" aria-hidden="true" />
          Delete customer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
