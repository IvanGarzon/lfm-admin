'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import Link from 'next/link';
import { Text, X, Check, AlertCircle, CircleDashed, Timer } from 'lucide-react';

import { formatCurrency } from '@/lib/utils';
import {
  InvoiceStatusSchema,
  type InvoiceStatusType,
} from '@/zod/inputTypeSchemas/InvoiceStatusSchema';
import { Box } from '@/components/ui/box';
import { DataTableColumnHeader } from '@/components/shared/tableV3/data-table-column-header';
import { UserAvatar } from '@/components/shared/user-avatar';
import type { InvoiceListItem } from '@/features/finances/invoices/types';
import { InvoiceStatusBadge } from '@/features/finances/invoices/components/invoice-status-badge';
import { InvoiceActions } from '@/features/finances/invoices/components/invoice-actions';
import { useInvoiceQueryString } from '@/features/finances/invoices/hooks/use-invoice-query-string';
import { searchParams, invoiceSearchParamsDefaults } from '@/filters/invoices/invoices-filters';

function InvoiceLink({ invoiceId, invoiceNumber }: { invoiceId: string; invoiceNumber: string }) {
  const queryString = useInvoiceQueryString(searchParams, invoiceSearchParamsDefaults);
  const basePath = `/finances/invoices/${invoiceId}`;
  const href = queryString ? `${basePath}?${queryString}` : basePath;

  return (
    <Link href={href} className="font-medium hover:text-primary transition-colors hover:underline">
      {invoiceNumber}
    </Link>
  );
}

const StatusOptions: {
  label: string;
  value: InvoiceStatusType;
  icon: React.FC;
}[] = [
  {
    label: 'Draft',
    value: InvoiceStatusSchema.enum.DRAFT,
    icon: CircleDashed,
  },
  {
    label: 'Pending',
    value: InvoiceStatusSchema.enum.PENDING,
    icon: AlertCircle,
  },
  {
    label: 'Paid',
    value: InvoiceStatusSchema.enum.PAID,
    icon: Check,
  },
  {
    label: 'Cancelled',
    value: InvoiceStatusSchema.enum.CANCELLED,
    icon: X,
  },
  {
    label: 'Overdue',
    value: InvoiceStatusSchema.enum.OVERDUE,
    icon: Timer,
  },
];

export const createInvoiceColumns = (
  onDelete: (id: string) => void,
  onSendReminder: (id: string) => void,
  onMarkAsPending: (id: string) => void,
  onMarkAsPaid: (id: string) => void,
  onCancel: (id: string) => void,
  onDownloadPdf: (id: string) => void,
  onSendReceipt?: (id: string) => void,
): ColumnDef<InvoiceListItem>[] => [
  {
    id: 'search',
    accessorKey: 'invoiceNumber',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice #" />,
    cell: ({ row }) => (
      <Box className="flex flex-col">
        <InvoiceLink invoiceId={row.original.id} invoiceNumber={row.original.invoiceNumber} />
      </Box>
    ),
    enableSorting: true,
    enableColumnFilter: true,
    meta: {
      label: 'Invoice #',
      placeholder: 'Search by Invoice number or by customer...',
      variant: 'text',
      icon: Text,
    },
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <InvoiceStatusBadge status={row.getValue('status')} />,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    enableColumnFilter: true,
    enableSorting: true,
    meta: {
      label: 'Status',
      variant: 'multiSelect',
      className: 'text-left',
      options: StatusOptions,
    },
  },
  {
    id: 'customer',
    accessorKey: 'customerName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
    cell: ({ row }) => (
      <Box className="flex flex-col">
        <Box className="flex items-center gap-3">
          <UserAvatar
            fontSize="0.7rem"
            className="h-7 w-7 font-medium rounded-full"
            user={{ name: row.original.customerName, image: null }}
          />
          <Box>
            <Box className="font-medium">{row.original.customerName}</Box>
            <Box className="text-xs text-muted-foreground">{row.original.customerEmail}</Box>
          </Box>
        </Box>
      </Box>
    ),
    meta: {
      label: 'Customer',
    },
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      return <Box className="font-semibold">{formatCurrency({ number: amount })}</Box>;
    },
    meta: {
      label: 'Amount',
    },
  },
  {
    accessorKey: 'issuedDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Issued" />,
    cell: ({ row }) => {
      return <Box>{format(row.getValue('issuedDate'), 'MMM dd, yyyy')}</Box>;
    },
    meta: {
      label: 'Issued',
    },
  },
  {
    accessorKey: 'dueDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Due Date" />,
    cell: ({ row }) => {
      return <Box>{format(row.getValue('dueDate'), 'MMM dd, yyyy')}</Box>;
    },
    meta: {
      label: 'Due',
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <InvoiceActions
        invoice={row.original}
        onDelete={onDelete}
        onSendReminder={onSendReminder}
        onMarkAsPending={onMarkAsPending}
        onMarkAsPaid={onMarkAsPaid}
        onCancel={onCancel}
        onDownloadPdf={onDownloadPdf}
        onSendReceipt={onSendReceipt}
      />
    ),
    enableHiding: false,
    meta: {
      className: 'text-right',
    },
  },
];
