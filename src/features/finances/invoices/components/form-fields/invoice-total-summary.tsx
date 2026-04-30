'use client';

import { formatCurrency } from '@/lib/utils';
import { Box } from '@/components/ui/box';

interface InvoiceTotalSummaryProps {
  subtotal: number;
  gst: number;
  gstAmount: number;
  discount: number;
  total: number;
}

export function InvoiceTotalSummary({
  subtotal,
  gst,
  gstAmount,
  discount,
  total,
}: InvoiceTotalSummaryProps) {
  return (
    <Box className="sticky bottom-0 border-t p-6 space-y-3 bg-muted">
      <Box className="flex justify-between items-center text-sm text-muted-foreground">
        <span>Subtotal:</span>
        <span>{formatCurrency({ number: subtotal })}</span>
      </Box>
      <Box className="flex justify-between items-center text-sm text-muted-foreground">
        <span>Gst ({gst}%):</span>
        <span>{formatCurrency({ number: gstAmount })}</span>
      </Box>
      {discount > 0 ? (
        <Box className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Discount:</span>
          <span>-{formatCurrency({ number: discount })}</span>
        </Box>
      ) : null}
      <Box className="flex justify-between items-center text-lg font-bold pt-3 border-t border-border">
        <span>Invoice Total:</span>
        <span>{formatCurrency({ number: total })}</span>
      </Box>
    </Box>
  );
}
