'use client';

import { useState } from 'react';
import { Download, Send, Loader2 } from 'lucide-react';
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
  InvoiceMetadata,
  InvoiceItemDetail,
  InvoicePaymentItem,
} from '@/features/finances/invoices/types';
import { InvoicePreview } from '@/features/finances/invoices/components/invoice-preview';

const EMPTY_ITEMS: InvoiceItemDetail[] = [];
const EMPTY_PAYMENTS: InvoicePaymentItem[] = [];

interface SendInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceMetadata | InvoiceWithDetails;
  items?: InvoiceItemDetail[];
  payments?: InvoicePaymentItem[];
  isLoadingItems?: boolean;
  isLoadingPayments?: boolean;
  onDownload: () => Promise<void>;
  onSendEmail?: () => Promise<void>;
}

export function SendInvoiceDialog({
  open,
  onOpenChange,
  invoice,
  items = EMPTY_ITEMS,
  payments = EMPTY_PAYMENTS,
  isLoadingItems = false,
  isLoadingPayments = false,
  onDownload,
  onSendEmail,
}: SendInvoiceDialogProps) {
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
      toast.success('Invoice sent successfully');
      onOpenChange(false);
    } catch (error) {
      // Error already shown via toast
      toast.error('Failed to send invoice');
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
              <DialogTitle>Send Invoice</DialogTitle>
              <DialogDescription>
                Preview and send invoice #{invoice.invoiceNumber}
              </DialogDescription>
            </Box>
          </Box>
        </DialogHeader>

        <Box className="flex-1 bg-muted overflow-hidden">
          <InvoicePreview
            invoice={invoice}
            items={items}
            payments={payments}
            isLoadingItems={isLoadingItems}
            isLoadingPayments={isLoadingPayments}
          />
        </Box>

        <DialogFooter className="px-6 py-4 border-t bg-muted/50">
          <Box className="flex items-center justify-between w-full">
            <Box className="text-sm text-muted-foreground">
              Send invoice to <strong>{invoice.customer.email}</strong>
            </Box>
            <Box className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="h-4 w-4" aria-hidden="true" />
                )}
                {isDownloading ? 'Downloading...' : 'Download'}
              </Button>
              <Button type="button" onClick={handleSendEmail} disabled={isSendingEmail}>
                {isSendingEmail ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
                {isSendingEmail ? 'Sending...' : 'Send Invoice'}
              </Button>
            </Box>
          </Box>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
