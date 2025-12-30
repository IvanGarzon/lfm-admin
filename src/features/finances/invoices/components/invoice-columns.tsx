'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  Text,
  Ban,
  CircleCheckBig,
  Hourglass,
  CircleDashed,
  Timer,
  Bell,
  SquareDashedTopSolid,
} from 'lucide-react';
import { InvoiceStatus } from '@/prisma/client';
import { formatCurrency } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { DataTableColumnHeader } from '@/components/shared/tableV3/data-table-column-header';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Checkbox } from '@/components/ui/checkbox';
import type { InvoiceListItem } from '@/features/finances/invoices/types';
import { InvoiceStatusBadge } from '@/features/finances/invoices/components/invoice-status-badge';
import { InvoiceActions } from '@/features/finances/invoices/components/invoice-actions';
import { useInvoiceQueryString } from '@/features/finances/invoices/hooks/use-invoice-query-string';
import { invoiceSearchParamsDefaults, searchParams } from '@/filters/invoices/invoices-filters';
import {
  daysUntilDue,
  getOverdueDays,
  getUrgency,
  isOverdue,
  needsReminder,
} from '@/features/finances/invoices/utils/invoice-helpers';

const StatusOptions: {
  label: string;
  value: InvoiceStatus;
  icon: React.FC;
}[] = [
  {
    label: 'Draft',
    value: InvoiceStatus.DRAFT,
    icon: CircleDashed,
  },
  {
    label: 'Pending',
    value: InvoiceStatus.PENDING,
    icon: Hourglass,
  },
  {
    label: 'Paid',
    value: InvoiceStatus.PAID,
    icon: CircleCheckBig,
  },
  {
    label: 'Partially Paid',
    value: InvoiceStatus.PARTIALLY_PAID,
    icon: SquareDashedTopSolid,
  },
  {
    label: 'Overdue',
    value: InvoiceStatus.OVERDUE,
    icon: Timer,
  },
  {
    label: 'Cancelled',
    value: InvoiceStatus.CANCELLED,
    icon: Ban,
  },
];

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

export const createInvoiceColumns = (
  onDelete: (id: string, invoiceNumber: string) => void,
  onSendReminder: (id: string) => void,
  onMarkAsPending: (id: string) => void,
  onRecordPayment: (id: string, invoiceNumber: string) => void,
  onCancel: (id: string, invoiceNumber: string) => void,
  onDownloadPdf: (id: string) => void,
  onMarkAsDraft: (id: string) => void,
  onSendReceipt?: (id: string) => void,
  onDuplicate?: (id: string) => void,
): ColumnDef<InvoiceListItem>[] => [
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
  },
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
      // We can also show amountDue if it differs
      const amountDue = row.original.amountDue;
      const amountPaid = row.original.amountPaid;

      return (
        <Box className="flex flex-col">
          <span className="font-semibold">{formatCurrency({ number: amount })}</span>
          {amountDue > 0 && amountPaid > 0 && amountDue < amount ? (
            <span className="text-xs text-muted-foreground font-medium">
              Due: {formatCurrency({ number: amountDue })}
            </span>
          ) : null}
        </Box>
      );
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
      const dueDate: Date = row.getValue('dueDate');
      const invoice = row.original;

      // Calculate urgency and derived values
      const urgency = getUrgency(invoice);
      const isOverdueItem = isOverdue(invoice);
      const daysDiff = daysUntilDue(dueDate);
      const daysOverdue = getOverdueDays(dueDate);
      const showReminder = needsReminder(invoice);

      // Determine color and icon based on urgency
      let colorClass = 'text-muted-foreground';
      let Icon = null;
      let statusText = null;

      if (urgency === 'critical') {
        colorClass = 'text-destructive';
        Icon = Timer;
        statusText = `Overdue by ${daysOverdue} days`;
      } else if (urgency === 'high') {
        colorClass = 'text-orange-600';
        Icon = Timer;
        statusText = `Due in ${daysDiff} days`;
      } else if (urgency === 'medium') {
        colorClass = 'text-yellow-600';
        Icon = Timer;
        statusText = `Due in ${daysDiff} days`;
      }

      // Don't show overdue/due status for paid/cancelled invoices
      if (invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.CANCELLED) {
        return (
          <Box className="flex flex-col">
            <span className="text-muted-foreground">{format(dueDate, 'MMM dd, yyyy')}</span>
          </Box>
        );
      }

      // Determine the date color based on urgency and status
      const dateColorClass =
        invoice.status === InvoiceStatus.PENDING && urgency !== 'critical'
          ? 'text-gray-600'
          : colorClass;

      return (
        <Box className="flex flex-col">
          <Box className="flex items-center gap-2">
            <span className={`${dateColorClass} ${statusText ? 'font-semibold' : ''}`}>
              {format(dueDate, 'MMM dd, yyyy')}
            </span>
            {showReminder ? <Bell className="h-3 w-3 text-blue-500 animate-pulse" /> : null}
          </Box>
          {statusText ? (
            <div className={`flex items-center text-xs ${colorClass}`}>
              {Icon ? <Icon className="mr-1 h-3 w-3" /> : null}
              <span>{statusText}</span>
            </div>
          ) : null}
        </Box>
      );
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
        onRecordPayment={onRecordPayment}
        onCancel={onCancel}
        onDownloadPdf={onDownloadPdf}
        onSendReceipt={onSendReceipt}
        onDuplicate={onDuplicate ?? (() => {})}
        onMarkAsDraft={onMarkAsDraft}
      />
    ),
    enableHiding: false,
    meta: {
      className: 'text-right',
    },
  },
];
