'use client';

import Link from 'next/link';
import { MoreHorizontal, Edit, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Transaction } from '../types';
import { useQueryString } from '@/hooks/use-query-string';
import {
  searchParams,
  transactionSearchParamsDefaults,
} from '@/filters/transactions/transactions-filters';

interface TransactionActionsProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
}

export function TransactionActions({ transaction, onDelete }: TransactionActionsProps) {
  const queryString = useQueryString(searchParams, transactionSearchParamsDefaults);
  const basePath = `/finances/transactions/${transaction.id}`;
  const transactionUrl = queryString ? `${basePath}?${queryString}` : basePath;

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
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(transaction.id)}>
          <Copy className="h-4 w-4" />
          Copy transaction ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={transactionUrl}>
            <Edit className="h-4 w-4" />
            Edit Transaction
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(transaction.id)}
          className="text-destructive focus:text-destructive hover:text-destructive bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/20 hover:dark:bg-red-900/30"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
