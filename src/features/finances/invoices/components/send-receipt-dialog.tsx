'use client';

import { useState } from 'react';
import { Download, Mail } from 'lucide-react';
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
import type { InvoiceWithDetails } from '@/features/finances/invoices/types';
import { ReceiptPreview } from '@/features/finances/invoices/components/receipt-preview';

interface SendReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceWithDetails;
  onDownload: () => Promise<void>;
  onSendEmail?: () => Promise<void>;
}

export function SendReceiptDialog({
  open,
  onOpenChange,
  invoice,
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
      console.error('Error downloading receipt:', error);
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
      console.error('Error sending receipt:', error);
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
          <ReceiptPreview invoice={invoice} />
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
                <Download className="h-4 w-4 mr-1" />
                {isDownloading ? 'Downloading...' : 'Download PDF'}
              </Button>
              <Button type="button" onClick={handleSendEmail} disabled={isSendingEmail}>
                <Mail className="h-4 w-4 mr-1" />
                {isSendingEmail ? 'Sending...' : 'Send Email'}
              </Button>
            </Box>
          </Box>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
