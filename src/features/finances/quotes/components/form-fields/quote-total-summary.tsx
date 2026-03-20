import { Box } from '@/components/ui/box';
import { formatCurrency } from '@/lib/utils';

interface QuoteTotalSummaryProps {
  subtotal: number;
  gst: number;
  tax: number;
  discount: number;
  total: number;
}

export function QuoteTotalSummary({ subtotal, gst, tax, discount, total }: QuoteTotalSummaryProps) {
  return (
    <Box className="sticky bottom-0 border-t p-6 space-y-3 bg-gray-50 dark:bg-gray-900">
      <Box className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
        <span>Subtotal:</span>
        <span>{formatCurrency({ number: subtotal })}</span>
      </Box>
      <Box className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
        <span>Gst ({gst}%):</span>
        <span>{formatCurrency({ number: tax })}</span>
      </Box>
      {discount > 0 ? (
        <Box className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
          <span>Discount:</span>
          <span>-{formatCurrency({ number: discount })}</span>
        </Box>
      ) : null}
      <Box className="flex justify-between items-center text-lg font-bold pt-3 border-t border-gray-200 dark:border-gray-700">
        <span>Quote Total:</span>
        <span>{formatCurrency({ number: total })}</span>
      </Box>
    </Box>
  );
}
