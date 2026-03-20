'use client';

import { Box } from '@/components/ui/box';
import type { QuoteWithDetails } from '@/features/finances/quotes/types';
import { QuotePreviewHeader } from './quote-preview-header';
import { QuotePreviewBillingInfo } from './quote-preview-billing-info';
import { QuotePreviewDates } from './quote-preview-dates';
import { QuotePreviewItemsTable } from './quote-preview-items-table';
import { QuotePreviewSummary } from './quote-preview-summary';
import { QuotePreviewItemDetails } from './quote-preview-item-details';
import { QuotePreviewNotes } from './quote-preview-notes';
import { QuotePreviewTerms } from './quote-preview-terms';

type QuoteHtmlPreviewProps = {
  quote: QuoteWithDetails;
};

export function QuotePreview({ quote }: QuoteHtmlPreviewProps) {
  const subtotal = quote.items.reduce((sum, item) => sum + item.total, 0);
  const gstAmount = (subtotal * quote.gst) / 100;
  const total = subtotal + gstAmount - quote.discount;

  return (
    <Box className="h-full overflow-y-auto bg-gray-100 dark:bg-gray-950 p-8">
      <Box className="bg-white dark:bg-gray-900 shadow-lg max-w-4xl mx-auto">
        <Box className="p-12">
          <QuotePreviewHeader quoteNumber={quote.quoteNumber} />

          <QuotePreviewBillingInfo customer={quote.customer} />

          <QuotePreviewDates issuedDate={quote.issuedDate} validUntil={quote.validUntil} />

          <QuotePreviewItemsTable items={quote.items} />

          <QuotePreviewSummary
            subtotal={subtotal}
            gst={quote.gst}
            gstAmount={gstAmount}
            discount={quote.discount}
            total={total}
          />

          <QuotePreviewItemDetails items={quote.items} />

          <QuotePreviewNotes notes={quote.notes} />

          <QuotePreviewTerms terms={quote.terms} currency={quote.currency} />
        </Box>
      </Box>
    </Box>
  );
}
