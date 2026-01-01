'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import Link from 'next/link';
import { Text, X, Check, CircleDashed, Send, Clock, FileCheck, Pause } from 'lucide-react';

import { formatCurrency } from '@/lib/utils';
import { QuoteStatusSchema, type QuoteStatusType } from '@/zod/inputTypeSchemas/QuoteStatusSchema';
import { Box } from '@/components/ui/box';
import { DataTableColumnHeader } from '@/components/shared/tableV3/data-table-column-header';
import type { QuoteListItem } from '@/features/finances/quotes/types';
import { QuoteStatusBadge } from '@/features/finances/quotes/components/quote-status-badge';
import { QuoteActions } from '@/features/finances/quotes/components/quote-actions';
import { searchParams, quoteSearchParamsDefaults } from '@/filters/quotes/quotes-filters';
import { useQuoteQueryString } from '@/features/finances/quotes/hooks/use-quote-query-string';
import { isExpired } from '@/features/finances/quotes/utils/quote-helpers';

function QuoteLink({ quoteId, quoteNumber }: { quoteId: string; quoteNumber: string }) {
  const queryString = useQuoteQueryString(searchParams, quoteSearchParamsDefaults);
  const basePath = `/finances/quotes/${quoteId}`;
  const href = queryString ? `${basePath}?${queryString}` : basePath;

  return (
    <Link href={href} className="font-medium hover:text-primary transition-colors hover:underline">
      {quoteNumber}
    </Link>
  );
}

const StatusOptions: {
  label: string;
  value: QuoteStatusType;
  icon: React.FC;
}[] = [
  {
    label: 'Draft',
    value: QuoteStatusSchema.enum.DRAFT,
    icon: CircleDashed,
  },
  {
    label: 'Sent',
    value: QuoteStatusSchema.enum.SENT,
    icon: Send,
  },
  {
    label: 'On Hold',
    value: QuoteStatusSchema.enum.ON_HOLD,
    icon: Pause,
  },
  {
    label: 'Accepted',
    value: QuoteStatusSchema.enum.ACCEPTED,
    icon: Check,
  },
  {
    label: 'Rejected',
    value: QuoteStatusSchema.enum.REJECTED,
    icon: X,
  },
  {
    label: 'Expired',
    value: QuoteStatusSchema.enum.EXPIRED,
    icon: Clock,
  },
  {
    label: 'Cancelled',
    value: QuoteStatusSchema.enum.CANCELLED,
    icon: X,
  },
  {
    label: 'Converted',
    value: QuoteStatusSchema.enum.CONVERTED,
    icon: FileCheck,
  },
];

export const createQuoteColumns = (
  onDelete: (id: string, quoteNumber: string) => void,
  onAccept: (id: string) => void,
  onReject: (id: string, quoteNumber: string) => void,
  onSend: (id: string) => void,
  onOnHold: (id: string, quoteNumber: string) => void,
  onCancel: (id: string, quoteNumber: string) => void,
  onConvert: (id: string, quoteNumber: string, gst: number, discount: number) => void,
  onDownloadPdf: (id: string) => void,
  onSendEmail: (id: string) => void,
  onSendFollowUp: (id: string) => void,
  onCreateVersion: (id: string) => void,
  onDuplicate: (id: string) => void,
): ColumnDef<QuoteListItem>[] => [
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
    accessorKey: 'quoteNumber',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Quote #" />,
    cell: ({ row }) => (
      <Box className="flex flex-col">
        <QuoteLink quoteId={row.original.id} quoteNumber={row.original.quoteNumber} />
      </Box>
    ),
    enableSorting: true,
    enableColumnFilter: true,
    meta: {
      label: 'Quote #',
      placeholder: 'Search by Quote number or by customer...',
      variant: 'text',
      icon: Text,
    },
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <QuoteStatusBadge status={row.getValue('status')} />,
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
    accessorKey: 'customerName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
    cell: ({ row }) => {
      const customerName = row.getValue('customerName') as string;
      const customerEmail = row.original.customerEmail;

      return (
        <Box className="flex flex-col gap-1">
          <span className="font-medium">{customerName}</span>
          <span className="text-xs text-muted-foreground">{customerEmail}</span>
        </Box>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => {
      const amount = row.getValue('amount') as number;
      return <span className="font-medium">{formatCurrency({ number: amount })}</span>;
    },
    enableSorting: true,
  },
  {
    accessorKey: 'issuedDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Issued" />,
    cell: ({ row }) => {
      const date = row.getValue('issuedDate') as Date;
      return <span className="text-sm text-muted-foreground">{format(date, 'MMM dd, yyyy')}</span>;
    },
    enableSorting: true,
  },
  {
    accessorKey: 'validUntil',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Valid Until" />,
    cell: ({ row }) => {
      const quoteStatus: QuoteStatusType = row.getValue('status');
      const validUntil: Date = row.getValue('validUntil');
      const quoteHasExpired = isExpired(quoteStatus, validUntil);
      return (
        <span
          className={quoteHasExpired ? 'text-sm text-red-600' : 'text-sm text-muted-foreground'}
        >
          {format(validUntil, 'MMM dd, yyyy')}
        </span>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'versionNumber',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Version" />,
    cell: ({ row }) => {
      const versionNumber: number = row.getValue('versionNumber');
      return <span className="font-medium">{versionNumber}</span>;
    },
    enableSorting: true,
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <QuoteActions
        quote={row.original}
        onDelete={onDelete}
        onAccept={onAccept}
        onReject={onReject}
        onSend={onSend}
        onOnHold={onOnHold}
        onCancel={onCancel}
        onConvert={onConvert}
        onDownloadPdf={onDownloadPdf}
        onSendEmail={onSendEmail}
        onSendFollowUp={onSendFollowUp}
        onCreateVersion={onCreateVersion}
        onDuplicate={onDuplicate}
      />
    ),
  },
];
