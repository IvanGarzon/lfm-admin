'use client';

import { InvoiceStatusSchema, type InvoiceStatus } from '@/zod/schemas/enums/InvoiceStatus.schema';
import Link from 'next/link';
import {
  Ban,
  Eye,
  Receipt,
  CreditCard,
  Hourglass,
  FileDown,
  BellRing,
  Trash,
  MoreHorizontal,
  Copy,
  RotateCcw,
} from 'lucide-react';

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
import { useQueryString } from '@/hooks/use-query-string';
import { searchParams, invoiceSearchParamsDefaults } from '@/filters/invoices/invoices-filters';

interface InvoiceActionsProps {
  invoice: InvoiceListItem;
  onDelete: (id: string, invoiceNumber: string) => void;
  onSendReminder: (id: string) => void;
  onMarkAsPending: (id: string, invoiceNumber: string) => void;
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
  const queryString = useQueryString(searchParams, invoiceSearchParamsDefaults);
  const basePath = `/finances/invoices/${invoice.id}`;
  const invoiceUrl = queryString ? `${basePath}?${queryString}` : basePath;

  return (
    <Box className="flex items-center gap-1 justify-end">
      <Button
        variant="secondary"
        size="icon"
        className="h-8 w-8 p-0"
        onClick={() => onDownloadPdf(invoice.id)}
        aria-label="Download invoice"
        title="Download invoice"
      >
        <FileDown aria-hidden="true" className="h-4 w-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="h-8 w-8 p-0" variant="secondary" aria-label="Open actions menu">
            <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={invoiceUrl}>
              <Eye aria-hidden="true" className="h-4 w-4" />
              View invoice
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDuplicate(invoice.id)}>
            <Copy aria-hidden="true" className="h-4 w-4" />
            Duplicate invoice
          </DropdownMenuItem>
          {invoice.status === InvoiceStatusSchema.enum.DRAFT && (
            <DropdownMenuItem onClick={() => onMarkAsPending(invoice.id, invoice.invoiceNumber)}>
              <Hourglass aria-hidden="true" className="h-4 w-4" />
              Mark as pending
            </DropdownMenuItem>
          )}
          {(invoice.status === InvoiceStatusSchema.enum.PENDING ||
            invoice.status === InvoiceStatusSchema.enum.OVERDUE ||
            invoice.status === InvoiceStatusSchema.enum.PARTIALLY_PAID) && (
            <>
              <DropdownMenuItem onClick={() => onRecordPayment(invoice.id, invoice.invoiceNumber)}>
                <CreditCard aria-hidden="true" className="h-4 w-4" />
                Record payment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSendReminder(invoice.id)}>
                <BellRing aria-hidden="true" className="h-4 w-4" />
                Send reminder
              </DropdownMenuItem>
              <>
                <DropdownMenuSeparator />

                {invoice.status === InvoiceStatusSchema.enum.PENDING ? (
                  <DropdownMenuItem onClick={() => onMarkAsDraft(invoice.id)}>
                    <RotateCcw aria-hidden="true" className="h-4 w-4" />
                    Revert to draft
                  </DropdownMenuItem>
                ) : null}

                <DropdownMenuItem
                  onClick={() => onCancel(invoice.id, invoice.invoiceNumber)}
                  className="text-destructive focus:text-destructive hover:text-destructive bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/20 hover:dark:bg-red-900/30"
                >
                  <Ban aria-hidden="true" className="h-4 w-4" />
                  Cancel invoice
                </DropdownMenuItem>
              </>
            </>
          )}

          {invoice.status === InvoiceStatusSchema.enum.PAID && onSendReceipt ? (
            <DropdownMenuItem onClick={() => onSendReceipt(invoice.id)}>
              <Receipt aria-hidden="true" className="h-4 w-4" />
              Send receipt
            </DropdownMenuItem>
          ) : null}

          {invoice.status === InvoiceStatusSchema.enum.DRAFT ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(invoice.id, invoice.invoiceNumber)}
                className="text-destructive focus:text-destructive hover:text-destructive bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/20 hover:dark:bg-red-900/30"
              >
                <Trash aria-hidden="true" className="h-4 w-4" />
                Delete invoice
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </Box>
  );
}
