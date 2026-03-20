import { Box } from '@/components/ui/box';
import { formatCurrency } from '@/lib/utils';

interface QuotePreviewSummaryProps {
  subtotal: number;
  gst: number;
  gstAmount: number;
  discount: number;
  total: number;
}

export function QuotePreviewSummary({
  subtotal,
  gst,
  gstAmount,
  discount,
  total,
}: QuotePreviewSummaryProps) {
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
          <p className="text-sm text-gray-600 dark:text-gray-400">GST ({gst}%)</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
            {formatCurrency({ number: gstAmount })}
          </p>
        </Box>

        {discount > 0 ? (
          <Box className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Discount</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
              -{formatCurrency({ number: discount })}
            </p>
          </Box>
        ) : null}

        <Box className="flex justify-between items-center pt-3 border-t-2 border-gray-900 dark:border-gray-50">
          <p className="text-base font-bold text-gray-900 dark:text-gray-50">Quote Total</p>
          <p className="text-base font-bold text-gray-900 dark:text-gray-50">
            {formatCurrency({ number: total })}
          </p>
        </Box>
      </Box>
    </Box>
  );
}
