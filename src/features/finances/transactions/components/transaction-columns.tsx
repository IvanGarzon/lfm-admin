'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  MoreHorizontal,
  Text,
  CircleDashed,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/shared/tableV3/data-table-column-header';
import { Checkbox } from '@/components/ui/checkbox';
import type { Transaction } from '../types';
import { TransactionStatusBadge } from './transaction-status-badge';
import { TransactionType, TransactionStatus } from '@/prisma/client';

const TypeOptions = [
  {
    label: 'Income',
    value: TransactionType.INCOME,
    icon: ArrowUpCircle,
  },
  {
    label: 'Expense',
    value: TransactionType.EXPENSE,
    icon: ArrowDownCircle,
  },
];

const StatusOptions = [
  {
    label: 'Pending',
    value: TransactionStatus.PENDING,
    icon: CircleDashed,
  },
  {
    label: 'Completed',
    value: TransactionStatus.COMPLETED,
    icon: CheckCircle,
  },
  {
    label: 'Cancelled',
    value: TransactionStatus.CANCELLED,
    icon: XCircle,
  },
];

export const createTransactionColumns = (
  onEdit: (transaction: Transaction) => void,
  onDelete: (id: string) => void,
): ColumnDef<Transaction>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    meta: {
      label: 'Select',
      variant: 'text',
    },
  },
  {
    id: 'search',
    accessorKey: 'description',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => {
      const transaction = row.original;
      return (
        <Box className="flex flex-col">
          <span className="font-medium">{transaction.description}</span>
          <span className="text-xs text-muted-foreground">{transaction.payee}</span>
        </Box>
      );
    },
    enableSorting: true,
    enableColumnFilter: true,
    meta: {
      label: 'Description',
      placeholder: 'Search by description or payee...',
      variant: 'text',
      icon: Text,
    },
  },
  {
    id: 'type',
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      const isIncome = type === 'INCOME';

      return (
        <Box className="flex items-center gap-2">
          {isIncome ? (
            <ArrowUpCircle className="h-4 w-4 text-green-600" />
          ) : (
            <ArrowDownCircle className="h-4 w-4 text-red-600" />
          )}
          <Badge variant={isIncome ? 'success' : 'destructive'}>
            {isIncome ? 'Income' : 'Expense'}
          </Badge>
        </Box>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    enableSorting: false,
    enableColumnFilter: true,
    meta: {
      label: 'Type',
      variant: 'multiSelect',
      options: TypeOptions,
    },
  },
  {
    id: 'date',
    accessorKey: 'date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => {
      const date: Date = row.getValue('date');
      return <Box>{format(date, 'MMM dd, yyyy')}</Box>;
    },
    enableSorting: true,
    meta: {
      label: 'Date',
    },
  },
  {
    id: 'categories',
    accessorKey: 'categories',
    header: 'Categories',
    cell: ({ row }) => {
      const transaction = row.original;
      const categories = (transaction as any).categories || [];

      if (categories.length === 0) {
        return <Badge variant="outline">Uncategorized</Badge>;
      }

      return (
        <Box className="flex flex-wrap gap-1">
          {categories.map((cat: any) => (
            <Badge key={cat.category.id} variant="outline" className="capitalize">
              {cat.category.name.toLowerCase().replace(/_/g, ' ')}
            </Badge>
          ))}
        </Box>
      );
    },
    enableSorting: false,
    meta: {
      label: 'Categories',
    },
  },
  {
    id: 'amount',
    accessorKey: 'amount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      const type = row.original.type;
      const isIncome = type === 'INCOME';

      return (
        <Box className="flex flex-col">
          <span className={`font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
            {isIncome ? '+' : '-'}
            {formatCurrency({ number: Math.abs(amount) })}
          </span>
        </Box>
      );
    },
    enableSorting: true,
    meta: {
      label: 'Amount',
    },
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <TransactionStatusBadge status={row.getValue('status')} />,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    enableSorting: false,
    enableColumnFilter: true,
    meta: {
      label: 'Status',
      variant: 'multiSelect',
      options: StatusOptions,
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const transaction = row.original;

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
              Copy transaction ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(transaction)}>Edit</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(transaction.id)}
              className="text-destructive focus:text-destructive"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableHiding: false,
    meta: {
      className: 'text-right',
    },
  },
];
