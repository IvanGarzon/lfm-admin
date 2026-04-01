'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Text,
  CircleDashed,
  CheckCircle,
  XCircle,
  Paperclip,
} from 'lucide-react';
import Link from 'next/link';

import { formatCurrency } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/shared/tableV3/data-table-column-header';
import { Checkbox } from '@/components/ui/checkbox';
import type { TransactionListItem } from '@/features/finances/transactions/types';
import { TransactionStatusBadge } from '@/features/finances/transactions/components/transaction-status-badge';
import { TransactionTypeSchema } from '@/zod/schemas/enums/TransactionType.schema';
import { TransactionStatusSchema } from '@/zod/schemas/enums/TransactionStatus.schema';

import {
  searchParams,
  transactionSearchParamsDefaults,
} from '@/filters/transactions/transactions-filters';
import { useQueryString } from '@/hooks/use-query-string';
import { TransactionActions } from './transaction-actions';

const TypeOptions = [
  {
    label: 'Income',
    value: TransactionTypeSchema.enum.INCOME,
    icon: ArrowUpCircle,
  },
  {
    label: 'Expense',
    value: TransactionTypeSchema.enum.EXPENSE,
    icon: ArrowDownCircle,
  },
];

const StatusOptions = [
  {
    label: 'Pending',
    value: TransactionStatusSchema.enum.PENDING,
    icon: CircleDashed,
  },
  {
    label: 'Completed',
    value: TransactionStatusSchema.enum.COMPLETED,
    icon: CheckCircle,
  },
  {
    label: 'Cancelled',
    value: TransactionStatusSchema.enum.CANCELLED,
    icon: XCircle,
  },
];

function TransactionLink({
  transactionId,
  referenceNumber,
}: {
  transactionId: string;
  referenceNumber: string;
}) {
  const queryString = useQueryString(searchParams, transactionSearchParamsDefaults);
  const basePath = `/finances/transactions/${transactionId}`;
  const href = queryString ? `${basePath}?${queryString}` : basePath;

  return (
    <Link href={href} className="font-medium hover:text-primary transition-colors hover:underline">
      {referenceNumber}
    </Link>
  );
}

export const createTransactionColumns = (
  onDelete: (id: string, referenceNumber?: string) => void,
): ColumnDef<TransactionListItem>[] => [
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
    id: 'referenceNumber',
    accessorKey: 'referenceNumber',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Ref #" />,
    cell: ({ row }) => {
      return (
        <Box className="flex flex-col">
          <TransactionLink
            transactionId={row.original.id}
            referenceNumber={row.original.referenceNumber || ''}
          />
        </Box>
      );
    },
    enableSorting: true,
    enableColumnFilter: true,
    meta: {
      label: 'Ref #',
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
      const isIncome = type === TransactionTypeSchema.enum.INCOME;

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
      const categories = transaction.categories || [];

      if (categories.length === 0) {
        return <Badge variant="outline">Uncategorized</Badge>;
      }

      return (
        <Box className="flex flex-wrap gap-1">
          {categories.map((cat: { category: { id: string; name: string } }) => (
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
      const isIncome = type === TransactionTypeSchema.enum.INCOME;

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
    id: 'attachments',
    accessorKey: 'attachments',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Attachments" className="justify-center" />
    ),
    cell: ({ row }) => {
      const attachments = row.original.attachments || [];
      const count = attachments.length;

      if (count === 0) return null;

      return (
        <Box className="flex items-center justify-center gap-1 text-muted-foreground">
          <Paperclip className="h-4 w-4" />
          <span className="text-xs font-medium">{count}</span>
        </Box>
      );
    },
    enableSorting: false,
    meta: {
      label: 'Attachments',
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
    cell: ({ row }) => (
      <TransactionActions
        transaction={row.original}
        onDelete={(id) => onDelete(id, row.original.referenceNumber ?? undefined)}
      />
    ),
    enableHiding: false,
    meta: {
      className: 'text-right',
    },
  },
];
