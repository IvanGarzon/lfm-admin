'use client';

import Link from 'next/link';
import { X, Eye, Send, Check, FileCheck, FileDown, MoreHorizontal } from 'lucide-react';

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
import { QuoteStatusSchema } from '@/zod/inputTypeSchemas/QuoteStatusSchema';
import type { QuoteListItem } from '@/features/finances/quotes/types';
import { useQuoteQueryString } from '@/features/finances/quotes/hooks/use-quote-query-string';
import { searchParams, quoteSearchParamsDefaults } from '@/filters/quotes/quotes-filters';

interface QuoteActionsProps {
  quote: QuoteListItem;
  onDelete: (id: string) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onSend: (id: string) => void;
  onConvert: (id: string) => void;
  onDownloadPdf: (id: string) => void;
}

export function QuoteActions({
  quote,
  onDelete,
  onAccept,
  onReject,
  onSend,
  onConvert,
  onDownloadPdf,
}: QuoteActionsProps) {
  const queryString = useQuoteQueryString(searchParams, quoteSearchParamsDefaults);
  const basePath = `/finances/quotes/${quote.id}`;
  const quoteUrl = queryString ? `${basePath}?${queryString}` : basePath;

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
          {quote.status === QuoteStatusSchema.enum.DRAFT && (
            <DropdownMenuItem onClick={() => onSend(quote.id)}>
              <Send className="h-4 w-4" />
              Send quote
            </DropdownMenuItem>
          )}
          {quote.status === QuoteStatusSchema.enum.SENT && (
            <>
              <DropdownMenuItem onClick={() => onAccept(quote.id)}>
                <Check className="h-4 w-4" />
                Mark as accepted
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onReject(quote.id)}>
                <X className="h-4 w-4" />
                Mark as rejected
              </DropdownMenuItem>
            </>
          )}
          {quote.status === QuoteStatusSchema.enum.ACCEPTED && (
            <DropdownMenuItem onClick={() => onConvert(quote.id)}>
              <FileCheck className="h-4 w-4" />
              Convert to invoice
            </DropdownMenuItem>
          )}
          {(quote.status === QuoteStatusSchema.enum.DRAFT ||
            quote.status === QuoteStatusSchema.enum.REJECTED ||
            quote.status === QuoteStatusSchema.enum.EXPIRED) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(quote.id)} className="text-destructive">
                <X className="h-4 w-4" />
                Delete quote
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </Box>
  );
}
