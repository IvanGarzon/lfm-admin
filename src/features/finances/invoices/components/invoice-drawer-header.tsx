'use client';

import { InvoiceStatusSchema, type InvoiceStatus } from '@/zod/schemas/enums/InvoiceStatus.schema';
import { X, AlertCircle, Eye, EyeOff, Save } from 'lucide-react';

import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { InvoiceStatusBadge } from '@/features/finances/invoices/components/invoice-status-badge';
import { InvoiceDrawerActionsMenu } from '@/features/finances/invoices/components/invoice-drawer-actions-menu';
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

interface InvoiceDrawerHeaderProps {
  mode: 'create' | 'edit';
  title: string;
  status: InvoiceStatus | null;
  hasUnsavedChanges: boolean;
  showPreview: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  onTogglePreview: () => void;
  onClose: () => void;
  invoice?: InvoiceMetadata | null;
  actionsMenuHandlers?: InvoiceDrawerActionsMenuHandlers;
}

export function InvoiceDrawerHeader({
  mode,
  title,
  status,
  hasUnsavedChanges,
  showPreview,
  isCreating,
  isUpdating,
  onTogglePreview,
  onClose,
  invoice,
  actionsMenuHandlers,
}: InvoiceDrawerHeaderProps) {
  return (
    <Box className="-mx-6 flex items-center justify-between gap-x-4 border-b border-gray-200 px-6 pb-4 dark:border-gray-900">
      <Box className="mt-1 flex flex-col flex-1">
        <Box className="flex items-center gap-2">
          <DrawerTitle>{title}</DrawerTitle>
          {mode === 'edit' && hasUnsavedChanges ? (
            <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-500 bg-amber-50 dark:bg-amber-900/20">
              <AlertCircle className="h-3 w-3" />
              Unsaved changes
            </span>
          ) : null}
        </Box>
        {status ? (
          <DrawerDescription>
            <InvoiceStatusBadge status={status} />
          </DrawerDescription>
        ) : null}
      </Box>

      <Box className="flex items-center gap-2">
        {mode === 'edit' ? (
          <Button type="button" variant="outline" size="sm" onClick={onTogglePreview}>
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4 mr-1" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Show Preview
              </>
            )}
          </Button>
        ) : null}

        {mode === 'create' ? (
          <Button type="submit" form="form-rhf-invoice" size="sm" disabled={isCreating}>
            <Save className="h-4 w-4 mr-1" />
            Save as Draft
          </Button>
        ) : null}

        {mode === 'edit' && invoice ? (
          <>
            {invoice.status !== InvoiceStatusSchema.enum.PAID ? (
              <Button
                type="submit"
                form="form-rhf-invoice"
                size="sm"
                disabled={isUpdating || !hasUnsavedChanges}
              >
                <Save className="h-4 w-4 mr-1" />
                {mode === 'edit' ? 'Update' : 'Save'}
              </Button>
            ) : null}

            {actionsMenuHandlers ? (
              <InvoiceDrawerActionsMenu
                invoice={invoice}
                handlers={actionsMenuHandlers}
                isDisabled={isUpdating}
              />
            ) : null}
          </>
        ) : null}

        <Button
          variant="ghost"
          className="aspect-square p-1 text-gray-500 hover:bg-gray-100 hover:dark:bg-gray-400/10"
          onClick={onClose}
        >
          <X className="size-5" aria-hidden="true" />
          <span className="sr-only">Close</span>
        </Button>
      </Box>
    </Box>
  );
}
