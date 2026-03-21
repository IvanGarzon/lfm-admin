'use client';

import { format } from 'date-fns';
import { Box } from '@/components/ui/box';
import { formatCurrency } from '@/lib/utils';
import type { InvoicePaymentItem } from '@/features/finances/invoices/types';

interface InvoicePreviewPaymentsProps {
  payments: InvoicePaymentItem[];
  isLoadingPayments?: boolean;
}

export function InvoicePreviewPayments({
  payments,
  isLoadingPayments = false,
}: InvoicePreviewPaymentsProps) {
  if (!isLoadingPayments && payments.length === 0) {
    return null;
  }

  return (
    <Box className="mb-8">
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">Payment History</p>
      <Box className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">
                Date
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">
                Method
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">
                Notes
              </th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {isLoadingPayments
              ? Array.from({ length: 2 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3">
                      <Box className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <Box className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <Box className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Box className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              : payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                      {format(payment.date, 'MMM dd, yyyy')}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                      {payment.method}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 text-xs italic">
                      {payment.notes || '-'}
                    </td>
                    <td className="px-4 py-2 text-sm font-medium text-right text-gray-900 dark:text-gray-100">
                      {formatCurrency({ number: payment.amount })}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </Box>
    </Box>
  );
}
