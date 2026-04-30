'use client';

import Link from 'next/link';
import { MoreHorizontal, Edit, Trash, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TransactionListItem } from '@/features/finances/transactions/types';
import { useQueryString } from '@/hooks/use-query-string';
import {
  searchParams,
  transactionSearchParamsDefaults,
} from '@/filters/transactions/transactions-filters';

interface TransactionActionsProps {
  transaction: TransactionListItem;
  onDelete: (id: string) => void;
}

export function TransactionActions({ transaction, onDelete }: TransactionActionsProps) {
  const queryString = useQueryString(searchParams, transactionSearchParamsDefaults);
  const basePath = `/finances/transactions/${transaction.id}`;
  const transactionUrl = queryString ? `${basePath}?${queryString}` : basePath;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-8 w-8 p-0" variant="secondary" aria-label="Open actions menu">
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(transaction.id)}>
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copy transaction ID
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={transactionUrl}>
            <Edit className="h-4 w-4" aria-hidden="true" />
            Edit transaction
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(transaction.id)}
          className="text-destructive focus:text-destructive hover:text-destructive bg-destructive/5 hover:bg-destructive/10 dark:bg-destructive/10 hover:dark:bg-destructive/20"
        >
          <Trash className="h-4 w-4" aria-hidden="true" />
          Delete transaction
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
