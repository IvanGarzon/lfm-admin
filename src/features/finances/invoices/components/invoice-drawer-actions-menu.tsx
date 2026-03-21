'use client';

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

import { InvoiceStatus } from '@/prisma/client';
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
          className="aspect-square p-1 text-gray-500 hover:bg-gray-100 hover:dark:bg-gray-400/10 cursor-pointer"
        >
          <MoreHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">More options</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={handlers.onDuplicate}>
          <Copy className="h-4 w-4" />
          Duplicate invoice
        </DropdownMenuItem>

        {invoice.status === InvoiceStatus.DRAFT && (
          <DropdownMenuItem onClick={handlers.onMarkAsPending}>
            <Hourglass className="h-4 w-4" />
            Mark as pending
          </DropdownMenuItem>
        )}

        {invoice.status === InvoiceStatus.PENDING && (
          <DropdownMenuItem onClick={handlers.onMarkAsDraft}>
            <RotateCcw className="h-4 w-4" />
            Revert to draft
          </DropdownMenuItem>
        )}

        {(invoice.status === InvoiceStatus.PENDING ||
          invoice.status === InvoiceStatus.OVERDUE ||
          invoice.status === InvoiceStatus.PARTIALLY_PAID) && (
          <>
            <DropdownMenuItem onClick={handlers.onRecordPayment}>
              <CreditCard className="h-4 w-4" />
              Record payment
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlers.onSendReminder}>
              <BellRing className="h-4 w-4" />
              Send reminder
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handlers.onCancel}
              className="text-destructive focus:text-destructive hover:text-destructive bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/20 hover:dark:bg-red-900/30"
            >
              <Ban className="h-4 w-4" />
              Cancel invoice
            </DropdownMenuItem>
          </>
        )}

        {invoice.status === InvoiceStatus.PAID && (
          <>
            <DropdownMenuItem onClick={handlers.onDownloadPdf}>
              <Download className="h-4 w-4" />
              Download invoice
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlers.onSendReceipt}>
              <Receipt className="h-4 w-4" />
              Send receipt
            </DropdownMenuItem>
          </>
        )}

        {invoice.status === InvoiceStatus.DRAFT && (
          <DropdownMenuItem
            onClick={handlers.onDelete}
            className="text-destructive focus:text-destructive hover:text-destructive bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/20 hover:dark:bg-red-900/30"
          >
            <AlertCircle className="h-4 w-4" />
            Delete invoice
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
