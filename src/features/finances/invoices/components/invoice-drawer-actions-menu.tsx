'use client';

import { InvoiceStatusSchema, type InvoiceStatus } from '@/zod/schemas/enums/InvoiceStatus.schema';
import {
  Ban,
  Receipt,
  CreditCard,
  AlertCircle,
  Download,
  MoreHorizontalIcon,
  Hourglass,
  BellRing,
  Copy,
  RotateCcw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { InvoiceMetadata } from '@/features/finances/invoices/types';

export interface InvoiceDrawerActionsMenuHandlers {
  onDuplicate: () => void;
  onMarkAsPending: () => void;
  onMarkAsDraft: () => void;
  onRecordPayment: () => void;
  onSendReminder: () => void;
  onCancel: () => void;
  onDownloadPdf: () => void;
  onSendReceipt: () => void;
  onDelete: () => void;
}

interface InvoiceDrawerActionsMenuProps {
  invoice: InvoiceMetadata;
  handlers: InvoiceDrawerActionsMenuHandlers;
  isDisabled?: boolean;
}

export function InvoiceDrawerActionsMenu({
  invoice,
  handlers,
  isDisabled = false,
}: InvoiceDrawerActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="More Options"
          disabled={isDisabled}
          className="aspect-square p-1 text-muted-foreground hover:bg-accent cursor-pointer"
        >
          <MoreHorizontalIcon aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only">More options</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={handlers.onDuplicate}>
          <Copy aria-hidden="true" className="h-4 w-4" />
          Duplicate invoice
        </DropdownMenuItem>

        {invoice.status === InvoiceStatusSchema.enum.DRAFT && (
          <DropdownMenuItem onClick={handlers.onMarkAsPending}>
            <Hourglass aria-hidden="true" className="h-4 w-4" />
            Mark as pending
          </DropdownMenuItem>
        )}

        {invoice.status === InvoiceStatusSchema.enum.PENDING && (
          <DropdownMenuItem onClick={handlers.onMarkAsDraft}>
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            Revert to draft
          </DropdownMenuItem>
        )}

        {(invoice.status === InvoiceStatusSchema.enum.PENDING ||
          invoice.status === InvoiceStatusSchema.enum.OVERDUE ||
          invoice.status === InvoiceStatusSchema.enum.PARTIALLY_PAID) && (
          <>
            <DropdownMenuItem onClick={handlers.onRecordPayment}>
              <CreditCard aria-hidden="true" className="h-4 w-4" />
              Record payment
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlers.onSendReminder}>
              <BellRing aria-hidden="true" className="h-4 w-4" />
              Send reminder
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handlers.onCancel}
              className="text-destructive focus:text-destructive hover:text-destructive bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/20 hover:dark:bg-red-900/30"
            >
              <Ban aria-hidden="true" className="h-4 w-4" />
              Cancel invoice
            </DropdownMenuItem>
          </>
        )}

        {invoice.status === InvoiceStatusSchema.enum.PAID && (
          <>
            <DropdownMenuItem onClick={handlers.onDownloadPdf}>
              <Download aria-hidden="true" className="h-4 w-4" />
              Download invoice
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlers.onSendReceipt}>
              <Receipt aria-hidden="true" className="h-4 w-4" />
              Send receipt
            </DropdownMenuItem>
          </>
        )}

        {invoice.status === InvoiceStatusSchema.enum.DRAFT && (
          <DropdownMenuItem
            onClick={handlers.onDelete}
            className="text-destructive focus:text-destructive hover:text-destructive bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/20 hover:dark:bg-red-900/30"
          >
            <AlertCircle aria-hidden="true" className="h-4 w-4" />
            Delete invoice
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
