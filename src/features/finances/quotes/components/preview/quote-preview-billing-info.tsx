import { Box } from '@/components/ui/box';
import { lasFloresAccount } from '@/constants/data';
import type { QuoteWithDetails } from '@/features/finances/quotes/types';

interface QuotePreviewBillingInfoProps {
  customer: QuoteWithDetails['customer'];
}

export function QuotePreviewBillingInfo({ customer }: QuotePreviewBillingInfoProps) {
  return (
    <Box className="grid grid-cols-2 gap-8 mb-8">
      <Box>
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">Quoted by:</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-1">
          {lasFloresAccount.accountName}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300">{lasFloresAccount.phone}</p>
        <p className="text-sm text-gray-700 dark:text-gray-300">{lasFloresAccount.email}</p>
        <p className="text-sm text-gray-700 dark:text-gray-300">AU ABN {lasFloresAccount.abn}</p>
      </Box>
      <Box>
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">Quoted to:</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-1">
          {customer.firstName} {customer.lastName}
        </p>
        {customer.phone && (
          <p className="text-sm text-gray-700 dark:text-gray-300">{customer.phone}</p>
        )}
        <p className="text-sm text-gray-700 dark:text-gray-300">{customer.email}</p>
        {customer.organization && customer.organization.name ? (
          <p className="text-sm text-gray-700 dark:text-gray-300">{customer.organization.name}</p>
        ) : null}
      </Box>
    </Box>
  );
}
