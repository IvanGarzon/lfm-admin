'use client';

import { useState } from 'react';
import { Mail, Paperclip, AlertCircle, Loader2, X, Send, FileCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { Badge } from '@/components/ui/badge';

export type EmailPreviewData = {
  to: string;
  subject: string;
  htmlContent: string;
  hasAttachment: boolean;
  attachmentName?: string;
  isTestMode: boolean;
  testRecipient?: string;
};

interface EmailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emailData: EmailPreviewData | null;
  isLoading?: boolean;
  onConfirm: () => void;
  onConfirmWithoutEmail?: () => void;
  onCancel: () => void;
  isSending?: boolean;
  isMarkingAsSent?: boolean;
  showMarkAsSentOption?: boolean;
  /**
   * Label for the status (e.g., "Sent" for quotes, "Pending" for invoices)
   * Used in "Mark as {status} (No Email)" button
   * @default "Sent"
   */
  statusLabel?: string;
}

export function EmailPreviewDialog({
  open,
  onOpenChange,
  emailData,
  isLoading = false,
  onConfirm,
  onConfirmWithoutEmail,
  onCancel,
  isSending = false,
  isMarkingAsSent = false,
  showMarkAsSentOption = false,
  statusLabel = 'Sent',
}: EmailPreviewDialogProps) {
  const [showRawHtml, setShowRawHtml] = useState(false);

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
  };

  const handleConfirmWithoutEmail = () => {
    if (onConfirmWithoutEmail) {
      onConfirmWithoutEmail();
    }
  };

  const isAnyActionPending = isSending || isMarkingAsSent;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Preview
          </DialogTitle>
          <DialogDescription>
            Review the email content before sending to the customer
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <Box className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </Box>
        ) : emailData ? (
          <Box className="flex-1 overflow-y-auto space-y-4">
            {emailData.isTestMode ? (
              <Box className="p-3 bg-amber-50 border border-amber-200 rounded-md dark:bg-amber-900/20 dark:border-amber-800">
                <Box className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <Box className="flex-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      Test Mode Active
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                      Email will be sent to {emailData.testRecipient} instead of the customer
                    </p>
                  </Box>
                </Box>
              </Box>
            ) : null}

            <Box className="space-y-2">
              <Box className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground min-w-16">To:</span>
                <span className="text-sm">{emailData.to}</span>
              </Box>
              <Box className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground min-w-16">Subject:</span>
                <span className="text-sm font-medium">{emailData.subject}</span>
              </Box>
              {emailData.hasAttachment ? (
                <Box className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground min-w-16">
                    Attachment:
                  </span>
                  <Badge variant="secondary" className="gap-1.5">
                    <Paperclip className="h-3 w-3" />
                    {emailData.attachmentName || 'PDF Attachment'}
                  </Badge>
                </Box>
              ) : null}
            </Box>

            <Box className="border-t pt-4">
              <Box className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Email Content</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRawHtml(!showRawHtml)}
                >
                  {showRawHtml ? 'Show Preview' : 'Show HTML'}
                </Button>
              </Box>

              <Box className="border rounded-md bg-white dark:bg-gray-950 max-h-96 overflow-y-auto">
                {showRawHtml ? (
                  <pre className="p-4 text-xs whitespace-pre-wrap break-words">
                    {emailData.htmlContent}
                  </pre>
                ) : (
                  <Box
                    className="p-4"
                    dangerouslySetInnerHTML={{ __html: emailData.htmlContent }}
                  />
                )}
              </Box>
            </Box>
          </Box>
        ) : (
          <Box className="flex items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">No preview available</p>
          </Box>
        )}

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isAnyActionPending}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          {showMarkAsSentOption ? (
            <Button
              type="button"
              variant="secondary"
              onClick={handleConfirmWithoutEmail}
              disabled={isLoading || !emailData || isAnyActionPending}
            >
              {isMarkingAsSent ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Marking as {statusLabel.toLowerCase()}...
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4 mr-2" />
                  Mark as {statusLabel} (No Email)
                </>
              )}
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || !emailData || isAnyActionPending}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
