'use client';

import Link from 'next/link';
import {
  Ban,
  Eye,
  Receipt,
  CreditCard,
  Hourglass,
  FileDown,
  BellRing,
  AlertCircle,
  MoreHorizontal,
  Copy,
  RotateCcw,
} from 'lucide-react';
import { InvoiceStatus } from '@/prisma/client';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { InvoiceListItem } from '@/features/finances/invoices/types';
import { useInvoiceQueryString } from '@/features/finances/invoices/hooks/use-invoice-query-string';
import { searchParams, invoiceSearchParamsDefaults } from '@/filters/invoices/invoices-filters';

interface InvoiceActionsProps {
  invoice: InvoiceListItem;
  onDelete: (id: string, invoiceNumber: string) => void;
  onSendReminder: (id: string) => void;
  onMarkAsPending: (id: string) => void;
  onRecordPayment: (id: string, invoiceNumber: string) => void;
  onCancel: (id: string, invoiceNumber: string) => void;
  onDownloadPdf: (id: string) => void;
  onSendReceipt?: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMarkAsDraft: (id: string) => void;
}

export function InvoiceActions({
  invoice,
  onDelete,
  onSendReminder,
  onMarkAsPending,
  onRecordPayment,
  onCancel,
  onDownloadPdf,
  onSendReceipt,
  onDuplicate,
  onMarkAsDraft,
}: InvoiceActionsProps) {
  const queryString = useInvoiceQueryString(searchParams, invoiceSearchParamsDefaults);
  const basePath = `/finances/invoices/${invoice.id}`;
  const invoiceUrl = queryString ? `${basePath}?${queryString}` : basePath;

  return (
    <Box className="flex items-center gap-1 justify-end">
      <Button
        variant="secondary"
        size="icon"
        className="h-8 w-8 p-0"
        onClick={() => onDownloadPdf(invoice.id)}
        title="Download PDF"
      >
        <span className="sr-only">Download PDF</span>
        <FileDown className="h-4 w-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="h-8 w-8 p-0" variant="secondary">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={invoiceUrl}>
              <Eye className="h-4 w-4" />
              View invoice
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDuplicate(invoice.id)}>
            <Copy className="h-4 w-4" />
            Duplicate invoice
          </DropdownMenuItem>
          {invoice.status === InvoiceStatus.DRAFT && (
            <DropdownMenuItem onClick={() => onMarkAsPending(invoice.id)}>
              <Hourglass className="h-4 w-4" />
              Mark as pending
            </DropdownMenuItem>
          )}
          {(invoice.status === InvoiceStatus.PENDING ||
            invoice.status === InvoiceStatus.OVERDUE ||
            invoice.status === InvoiceStatus.PARTIALLY_PAID) && (
            <>
              <DropdownMenuItem onClick={() => onRecordPayment(invoice.id, invoice.invoiceNumber)}>
                <CreditCard className="h-4 w-4" />
                Record payment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSendReminder(invoice.id)}>
                <BellRing className="h-4 w-4" />
                Send reminder
              </DropdownMenuItem>
              <>
                <DropdownMenuSeparator />
                {invoice.status === InvoiceStatus.PENDING && (
                  <DropdownMenuItem onClick={() => onMarkAsDraft(invoice.id)}>
                    <RotateCcw className="h-4 w-4" />
                    Revert to draft
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onCancel(invoice.id, invoice.invoiceNumber)}
                  className="text-destructive focus:text-destructive hover:text-destructive bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/20 hover:dark:bg-red-900/30"
                >
                  <Ban className="h-4 w-4" />
                  Cancel invoice
                </DropdownMenuItem>
              </>
            </>
          )}

          {invoice.status === InvoiceStatus.PAID && onSendReceipt ? (
            <DropdownMenuItem onClick={() => onSendReceipt(invoice.id)}>
              <Receipt className="h-4 w-4" />
              Send receipt
            </DropdownMenuItem>
          ) : null}

          {invoice.status === InvoiceStatus.DRAFT ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(invoice.id, invoice.invoiceNumber)}
                className="text-destructive focus:text-destructive hover:text-destructive bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/20 hover:dark:bg-red-900/30"
              >
                <AlertCircle className="h-4 w-4" />
                Delete invoice
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </Box>
  );
}
