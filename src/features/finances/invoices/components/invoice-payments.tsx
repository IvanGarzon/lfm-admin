'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { Box } from '@/components/ui/box';
import { InvoiceStatusBadge } from '@/features/finances/invoices/components/invoice-status-badge';
import type { InvoicePaymentItem } from '@/features/finances/invoices/types';
import { formatCurrency } from '@/lib/utils';
import type { InvoiceStatusType } from '@/zod/inputTypeSchemas/InvoiceStatusSchema';
import { InvoiceStatus } from '@/prisma/client';

interface InvoicePaymentsProps {
  payments: InvoicePaymentItem[];
  invoiceAmount: number;
}

/**
 * Invoice payments component
 *
 * Displays a list of payments made towards an invoice with payment details.
 * Calculates the invoice status after each payment to show accurate status.
 */
export function InvoicePayments({ payments, invoiceAmount }: InvoicePaymentsProps) {
  // Sort payments by date (oldest first) and calculate status after each payment
  const paymentsWithStatus = useMemo(() => {
    const sorted = [...payments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    let cumulativeAmount = 0;
    return sorted.map((payment) => {
      cumulativeAmount += payment.amount;
      const amountDue = invoiceAmount - cumulativeAmount;

      // Determine status after this payment
      let statusAfterPayment: InvoiceStatusType;
      if (amountDue <= 0.01) {
        // Floating point tolerance
        statusAfterPayment = InvoiceStatus.PAID;
      } else {
        statusAfterPayment = InvoiceStatus.PARTIALLY_PAID;
      }

      return {
        ...payment,
        statusAfterPayment,
      };
    });
  }, [payments, invoiceAmount]);

  return (
    <Box className="space-y-4">
      {paymentsWithStatus.map((payment) => (
        <Box key={payment.id} className="w-full p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
          {/* First row: Payment method and date */}
          <Box className="flex justify-between items-center mb-2">
            <p className="font-medium">{payment.method}</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(payment.date), 'MMM d, yyyy')}
            </p>
          </Box>

          {/* Second row: Invoice status and amount */}
          <Box className="flex justify-between items-center">
            <Box className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <InvoiceStatusBadge status={payment.statusAfterPayment} />
            </Box>
            <p className="text-lg font-semibold">{formatCurrency({ number: payment.amount })}</p>
          </Box>

          {/* Reference and notes */}
          {payment.reference ? (
            <p className="text-xs text-muted-foreground mt-3">Ref: {payment.reference}</p>
          ) : null}

          {payment.notes ? (
            <p className="text-sm text-muted-foreground mt-2">{payment.notes}</p>
          ) : null}
        </Box>
      ))}
    </Box>
  );
}
