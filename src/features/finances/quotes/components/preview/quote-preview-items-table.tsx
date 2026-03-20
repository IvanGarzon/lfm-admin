import { Box } from '@/components/ui/box';
import { formatCurrency } from '@/lib/utils';
import type { QuoteWithDetails } from '@/features/finances/quotes/types';

interface QuotePreviewItemsTableProps {
  items: QuoteWithDetails['items'];
}

export function QuotePreviewItemsTable({ items }: QuotePreviewItemsTableProps) {
  return (
    <Box className="mb-8">
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">Items</p>
      <Box className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">
                Items
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400">
                QTY
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">
                Cost
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                  {item.description}
                </td>
                <td className="px-4 py-2 text-sm text-center text-gray-900 dark:text-gray-100">
                  {item.quantity}
                </td>
                <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-gray-100">
                  {formatCurrency({ number: item.unitPrice })}
                </td>
                <td className="px-4 py-2 text-sm font-medium text-right text-gray-900 dark:text-gray-100">
                  {formatCurrency({ number: item.total })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </Box>
  );
}
