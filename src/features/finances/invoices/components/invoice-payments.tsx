'use client';

import { Box } from '@/components/ui/box';
import type { InvoicePaymentItem } from '../types';

interface InvoicePaymentsProps {
  payments: InvoicePaymentItem[];
}

/**
 * Invoice payments component
 *
 * Displays a list of payments made towards an invoice with payment details.
 */
export function InvoicePayments({ payments }: InvoicePaymentsProps) {
  return (
    <Box className="space-y-4">
      <h3 className="text-lg font-semibold">Payment History</h3>
      <Box className="space-y-3">
        {payments.map((payment) => (
          <Box key={payment.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
            <Box className="flex justify-between items-start">
              <Box>
                <p className="font-medium">${payment.amount.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(payment.date).toLocaleDateString()} • {payment.method}
                </p>
                {payment.reference && (
                  <p className="text-xs text-muted-foreground mt-1">Ref: {payment.reference}</p>
                )}
              </Box>
            </Box>
            {payment.notes && <p className="text-sm text-muted-foreground mt-2">{payment.notes}</p>}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
