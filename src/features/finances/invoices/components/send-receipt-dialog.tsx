'use client';

import { useState } from 'react';
import { Download, Receipt, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Box } from '@/components/ui/box';
import type {
  InvoiceWithDetails,
  InvoiceBasic,
  InvoiceItemDetail,
  InvoicePaymentItem,
} from '@/features/finances/invoices/types';
import { ReceiptPreview } from '@/features/finances/invoices/components/receipt-preview';

interface SendReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceBasic | InvoiceWithDetails;
  items?: InvoiceItemDetail[];
  payments?: InvoicePaymentItem[];
  isLoadingItems?: boolean;
  isLoadingPayments?: boolean;
  onDownload: () => Promise<void>;
  onSendEmail?: () => Promise<void>;
}

export function SendReceiptDialog({
  open,
  onOpenChange,
  invoice,
  items = [],
  payments = [],
  isLoadingItems = false,
  isLoadingPayments = false,
  onDownload,
  onSendEmail,
}: SendReceiptDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownload();
    } catch (error) {
      // Error is already handled by onDownload mutation (shows toast)
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!onSendEmail) {
      toast.info('Email functionality not yet implemented');
      return;
    }

    setIsSendingEmail(true);
    try {
      await onSendEmail();
      toast.success('Receipt sent successfully');
      onOpenChange(false);
    } catch (error) {
      // Error already shown via toast
      toast.error('Failed to send receipt');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 flex flex-col gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <Box className="flex items-center justify-between">
            <Box>
              <DialogTitle>Payment Receipt</DialogTitle>
              <DialogDescription>
                Receipt for invoice #{invoice.invoiceNumber} - Payment received
              </DialogDescription>
            </Box>
          </Box>
        </DialogHeader>

        <Box className="flex-1 bg-gray-100 dark:bg-gray-900 overflow-hidden">
          <ReceiptPreview
            invoice={invoice}
            items={items}
            payments={payments}
            isLoadingItems={isLoadingItems}
            isLoadingPayments={isLoadingPayments}
          />
        </Box>

        <DialogFooter className="px-6 py-4 border-t bg-gray-50 dark:bg-gray-900/50">
          <Box className="flex items-center justify-between w-full">
            <Box className="text-sm text-gray-600 dark:text-gray-400">
              Send receipt to <strong>{invoice.customer.email}</strong>
            </Box>
            <Box className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isDownloading ? 'Downloading...' : 'Download'}
              </Button>
              <Button type="button" onClick={handleSendEmail} disabled={isSendingEmail}>
                {isSendingEmail ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Receipt className="h-4 w-4 mr-2" />
                )}
                {isSendingEmail ? 'Sending...' : 'Send Receipt'}
              </Button>
            </Box>
          </Box>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
