'use client';

import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { CustomerListItem } from '@/features/customers/types';
import Link from 'next/link';
import { useCustomerQueryString } from '@/features/customers/hooks/use-customer-query-string';
import { customerSearchParamsDefaults, searchParams } from '@/filters/customers/customers-filters';

interface CustomerActionsProps {
  customer: CustomerListItem;
  onDelete: (id: string, name: string) => void;
}

export function CustomerActions({ customer, onDelete }: CustomerActionsProps) {
  const queryString = useCustomerQueryString(searchParams, customerSearchParamsDefaults);
  const basePath = `/customers/${customer.id}`;
  const href = queryString ? `${basePath}?${queryString}` : basePath;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={href} className="flex items-center">
            <Pencil className="mr-2 h-4 w-4" />
            View Customer
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => onDelete(customer.id, `${customer.firstName} ${customer.lastName}`)}
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete Customer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
