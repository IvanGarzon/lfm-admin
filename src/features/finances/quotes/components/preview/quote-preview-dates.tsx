import { format, differenceInDays } from 'date-fns';
import { Box } from '@/components/ui/box';

interface QuotePreviewDatesProps {
  issuedDate: Date;
  validUntil: Date;
}

export function QuotePreviewDates({ issuedDate, validUntil }: QuotePreviewDatesProps) {
  const daysUntilExpiry = differenceInDays(new Date(validUntil), new Date());
  const isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
  const isExpired = daysUntilExpiry < 0;

  return (
    <Box className="grid grid-cols-2 gap-8 mb-8">
      <Box>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Date Issued:</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
          {format(issuedDate, 'MMMM dd, yyyy')}
        </p>
      </Box>
      <Box>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Valid Until:</p>
        <p
          className={`text-sm font-semibold ${
            isExpired
              ? 'text-red-600 dark:text-red-400'
              : isExpiringSoon
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-gray-900 dark:text-gray-50'
          }`}
        >
          {format(validUntil, 'MMMM dd, yyyy')}
        </p>
      </Box>
    </Box>
  );
}
