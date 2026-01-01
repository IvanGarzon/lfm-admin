'use client';

import Link from 'next/link';
import {
  X,
  Eye,
  Send,
  Check,
  FileCheck,
  FileDown,
  MoreHorizontal,
  Copy,
  Files,
  AlertCircle,
  Pause,
  Ban,
  Mail,
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
import type { QuoteListItem } from '@/features/finances/quotes/types';
import { useQuoteQueryString } from '@/features/finances/quotes/hooks/use-quote-query-string';
import { searchParams, quoteSearchParamsDefaults } from '@/filters/quotes/quotes-filters';
import { getQuotePermissions } from '@/features/finances/quotes/utils/quote-helpers';

interface QuoteActionsProps {
  quote: QuoteListItem;
  onDelete: (id: string, quoteNumber: string) => void;
  onAccept: (id: string) => void;
  onReject: (id: string, quoteNumber: string) => void;
  onSend: (id: string) => void;
  onOnHold: (id: string, quoteNumber: string) => void;
  onCancel: (id: string, quoteNumber: string) => void;
  onConvert: (id: string, quoteNumber: string, gst: number, discount: number) => void;
  onDownloadPdf: (id: string) => void;
  onSendEmail: (id: string) => void;
  onSendFollowUp: (id: string) => void;
  onCreateVersion: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export function QuoteActions({
  quote,
  onDelete,
  onAccept,
  onReject,
  onSend,
  onOnHold,
  onCancel,
  onConvert,
  onDownloadPdf,
  onSendEmail,
  onSendFollowUp,
  onCreateVersion,
  onDuplicate,
}: QuoteActionsProps) {
  const queryString = useQuoteQueryString(searchParams, quoteSearchParamsDefaults);
  const basePath = `/finances/quotes/${quote.id}`;
  const quoteUrl = queryString ? `${basePath}?${queryString}` : basePath;

  // Get permissions based on quote status
  const {
    canAccept,
    canReject,
    canSend,
    canSendQuote,
    canPutOnHold,
    canCancel,
    canConvert,
    canDelete,
    canCreateVersion,
  } = getQuotePermissions(quote.status);

  // Check if follow-up should be available
  // Only show when status is SENT and within 3 days of validUntil
  const showFollowUp = (() => {
    if (quote.status !== 'SENT') return false;

    const now = new Date();
    const validUntil = new Date(quote.validUntil);
    const daysUntilExpiry = Math.ceil(
      (validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
  })();

  return (
    <Box className="flex items-center gap-1 justify-end">
      <Button
        variant="secondary"
        size="icon"
        className="h-8 w-8 p-0"
        onClick={() => onDownloadPdf(quote.id)}
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
            <Link href={quoteUrl}>
              <Eye className="h-4 w-4" />
              View quote
            </Link>
          </DropdownMenuItem>

          {canSend ? (
            <DropdownMenuItem onClick={() => onSend(quote.id)}>
              <Send className="h-4 w-4" />
              Send Quote
            </DropdownMenuItem>
          ) : null}

          {canPutOnHold ? (
            <DropdownMenuItem onClick={() => onOnHold(quote.id, quote.quoteNumber)}>
              <Pause className="h-4 w-4" />
              Put on hold
            </DropdownMenuItem>
          ) : null}

          {canAccept ? (
            <DropdownMenuItem onClick={() => onAccept(quote.id)}>
              <Check className="h-4 w-4" />
              Accept quote
            </DropdownMenuItem>
          ) : null}

          {canReject ? (
            <DropdownMenuItem onClick={() => onReject(quote.id, quote.quoteNumber)}>
              <X className="h-4 w-4" />
              Reject quote
            </DropdownMenuItem>
          ) : null}

          {canCancel ? (
            <DropdownMenuItem onClick={() => onCancel(quote.id, quote.quoteNumber)}>
              <Ban className="h-4 w-4" />
              Cancel quote
            </DropdownMenuItem>
          ) : null}

          {canConvert ? (
            <DropdownMenuItem
              onClick={() =>
                onConvert(quote.id, quote.quoteNumber, Number(quote.gst), Number(quote.discount))
              }
            >
              <FileCheck className="h-4 w-4" />
              Convert to invoice
            </DropdownMenuItem>
          ) : null}

          {canCreateVersion ? (
            <DropdownMenuItem onClick={() => onCreateVersion(quote.id)}>
              <Copy className="h-4 w-4" />
              Create new version
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuItem onClick={() => onDuplicate(quote.id)}>
            <Files className="h-4 w-4" />
            Duplicate quote
          </DropdownMenuItem>

          {canSendQuote ? (
            <DropdownMenuItem onClick={() => onSendEmail(quote.id)}>
              <Mail className="h-4 w-4" />
              Resend Quote
            </DropdownMenuItem>
          ) : null}

          {showFollowUp ? (
            <DropdownMenuItem onClick={() => onSendFollowUp(quote.id)}>
              <Send className="h-4 w-4" />
              Send Follow-up
            </DropdownMenuItem>
          ) : null}

          {canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(quote.id, quote.quoteNumber)}
                className="text-destructive focus:text-destructive hover:text-destructive bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/20 hover:dark:bg-red-900/30"
              >
                <AlertCircle className="h-4 w-4" />
                Delete quote
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </Box>
  );
}
