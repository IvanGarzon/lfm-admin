'use client';

import Link from 'next/link';
import { X, Eye, Mail, Check, Timer, FileDown, AlertCircle, MoreHorizontal } from 'lucide-react';

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
import { InvoiceStatusSchema } from '@/zod/inputTypeSchemas/InvoiceStatusSchema';
import type { InvoiceListItem } from '@/features/finances/invoices/types';
import { useInvoiceQueryString } from '@/features/finances/invoices/hooks/use-invoice-query-string';
import { searchParams, invoiceSearchParamsDefaults } from '@/filters/invoices/invoices-filters';

interface InvoiceActionsProps {
  invoice: InvoiceListItem;
  onDelete: (id: string) => void;
  onSendReminder: (id: string) => void;
  onMarkAsPending: (id: string) => void;
  onMarkAsPaid: (id: string) => void;
  onCancel: (id: string) => void;
  onDownloadPdf: (id: string) => void;
  onSendReceipt?: (id: string) => void;
}

export function InvoiceActions({
  invoice,
  onDelete,
  onSendReminder,
  onMarkAsPending,
  onMarkAsPaid,
  onCancel,
  onDownloadPdf,
  onSendReceipt,
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
          {invoice.status === InvoiceStatusSchema.enum.DRAFT && (
            <DropdownMenuItem onClick={() => onMarkAsPending(invoice.id)}>
              <Timer className="h-4 w-4" />
              Mark as pending
            </DropdownMenuItem>
          )}
          {(invoice.status === InvoiceStatusSchema.enum.PENDING ||
            invoice.status === InvoiceStatusSchema.enum.OVERDUE) && (
            <>
              <DropdownMenuItem onClick={() => onMarkAsPaid(invoice.id)}>
                <Check className="h-4 w-4" />
                Mark as paid
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSendReminder(invoice.id)}>
                <Mail className="h-4 w-4" />
                Send reminder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCancel(invoice.id)}>
                <X className="h-4 w-4" />
                Cancel invoice
              </DropdownMenuItem>
            </>
          )}
          {invoice.status === InvoiceStatusSchema.enum.PAID && onSendReceipt && (
            <DropdownMenuItem onClick={() => onSendReceipt(invoice.id)}>
              <Mail className="h-4 w-4" />
              Send receipt
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete(invoice.id)}
            className="text-destructive focus:text-destructive"
          >
            <AlertCircle className="h-4 w-4" />
            Delete invoice
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Box>
  );
}
