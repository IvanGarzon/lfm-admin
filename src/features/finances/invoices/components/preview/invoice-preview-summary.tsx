'use client';

import { Box } from '@/components/ui/box';
import { formatCurrency } from '@/lib/utils';
import type { InvoiceMetadata } from '@/features/finances/invoices/types';

interface InvoicePreviewSummaryProps {
  invoice: InvoiceMetadata;
  subtotal: number;
  gstAmount: number;
  total: number;
}

export function InvoicePreviewSummary({
  invoice,
  subtotal,
  gstAmount,
  total,
}: InvoicePreviewSummaryProps) {
  return (
    <Box className="flex justify-end mb-8">
      <Box className="w-1/2 space-y-3">
        <Box className="flex justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Subtotal</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
            {formatCurrency({ number: subtotal })}
          </p>
        </Box>

        <Box className="flex justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">GST ({invoice.gst}%)</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
            {formatCurrency({ number: gstAmount })}
          </p>
        </Box>

        {invoice.discount > 0 ? (
          <Box className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Discount</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
              -{formatCurrency({ number: invoice.discount })}
            </p>
          </Box>
        ) : null}

        <Box className="flex justify-between items-center pt-3 border-t-2 border-gray-900 dark:border-gray-50">
          <p className="text-base font-bold text-gray-900 dark:text-gray-50">Invoice Total</p>
          <p className="text-base font-bold text-gray-900 dark:text-gray-50">
            {formatCurrency({ number: total })}
          </p>
        </Box>

        {invoice.amountPaid > 0 ? (
          <>
            <Box className="flex justify-between items-center text-green-600 dark:text-green-400">
              <p className="text-sm">Amount Paid</p>
              <p className="text-sm font-semibold">
                -{formatCurrency({ number: invoice.amountPaid })}
              </p>
            </Box>
            <Box className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-lg font-bold text-gray-900 dark:text-gray-50">Amount Due</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-50">
                {formatCurrency({ number: invoice.amountDue })}
              </p>
            </Box>
          </>
        ) : null}
      </Box>
    </Box>
  );
}
