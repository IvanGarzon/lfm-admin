'use client';

import Link from 'next/link';
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
import { ProductListItem } from '@/features/inventory/products/types';
import { useProductHref } from '@/features/inventory/products/hooks/use-product-href';

export function ProductActions({
  product,
  onDelete,
}: {
  product: ProductListItem;
  onDelete: (id: string, name: string) => void;
}) {
  const href = useProductHref(product.id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className="h-8 w-8 p-0" aria-label="Open menu">
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={href} className="flex items-center">
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit product
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive hover:text-destructive bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/20 hover:dark:bg-red-900/30"
          onClick={() => onDelete(product.id, product.name)}
        >
          <Trash className="h-4 w-4" aria-hidden="true" />
          Delete product
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
