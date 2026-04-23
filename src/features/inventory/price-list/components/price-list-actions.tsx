'use client';

import Link from 'next/link';
import { MoreHorizontal, Pencil, Trash, History } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { PriceListItemListItem } from '@/features/inventory/price-list/types';
import { usePriceListHref } from '@/features/inventory/price-list/hooks/use-price-list-href';

export function PriceListActions({
  item,
  onDelete,
  onViewCostHistory,
}: {
  item: PriceListItemListItem;
  onDelete: (id: string, name: string) => void;
  onViewCostHistory: (id: string, name: string) => void;
}) {
  const href = usePriceListHref(item.id);

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
          <Link href={href}>
            <Pencil className="h-4 w-4" />
            Edit item
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onViewCostHistory(item.id, item.name)}>
          <History className="h-4 w-4" />
          Cost history
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete(item.id, item.name)}
        >
          <Trash className="h-4 w-4" />
          Delete item
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
