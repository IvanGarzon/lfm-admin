'use client';

import { format } from 'date-fns';
import { Box } from '@/components/ui/box';
import { formatCurrency } from '@/lib/utils';
import type { InvoiceWithDetails } from '@/features/finances/invoices/types';
import { lasFloresAccount } from '@/constants/data';

type ReceiptHtmlPreviewProps = {
  invoice: InvoiceWithDetails;
};

export function ReceiptPreview({ invoice }: ReceiptHtmlPreviewProps) {
  const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
  const gstAmount = (subtotal * invoice.gst) / 100;
  const total = subtotal + gstAmount - invoice.discount;

  return (
    <Box className="h-full overflow-y-auto bg-gray-100 dark:bg-gray-950 flex items-start justify-center py-8">
      <Box className="bg-white dark:bg-gray-900 shadow-lg max-w-4xl w-full mx-8">
        {/* Receipt Container */}
        <Box className="p-12">
          {/* Header */}
          <Box className="flex items-start justify-between mb-8">
            <Box>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-4">Receipt</h1>
              <Box className="space-y-1">
                <Box className="flex items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-32">
                    Receipt Number:{' '}
                  </span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-50">
                    #{invoice.invoiceNumber}
                  </span>
                </Box>
                <Box className="flex items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-32">
                    Payment Date:{' '}
                  </span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-50">
                    {invoice.paidDate ? format(invoice.paidDate, 'MMM dd, yyyy') : 'N/A'}
                  </span>
                </Box>
                <Box className="flex items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-32">
                    Payment Method:{' '}
                  </span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-50">
                    {invoice.paymentMethod || 'N/A'}
                  </span>
                </Box>
                <Box className="flex items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-32">
                    Amount Paid:{' '}
                  </span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-50">
                    {formatCurrency({ number: total })}
                  </span>
                </Box>
              </Box>
            </Box>
            <Box>
              <img
                src="/static/logo-green-800.png"
                alt="Las Flores Melbourne Logo"
                className="h-40 w-auto"
              />
            </Box>
          </Box>

          {/* Billing Information */}
          <Box className="grid grid-cols-2 gap-8 mb-8">
            <Box>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-1">
                {lasFloresAccount.accountName}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{lasFloresAccount.phone}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{lasFloresAccount.email}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                AU ABN {lasFloresAccount.abn}
              </p>
            </Box>
            <Box>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Bill to:
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-1">
                {invoice.customer.firstName} {invoice.customer.lastName}
              </p>
              {invoice.customer.phone && (
                <p className="text-sm text-gray-700 dark:text-gray-300">{invoice.customer.phone}</p>
              )}
              <p className="text-sm text-gray-700 dark:text-gray-300">{invoice.customer.email}</p>
              {invoice.customer.organization && invoice.customer.organization.name ? (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {invoice.customer.organization.name}
                </p>
              ) : null}
            </Box>
          </Box>

          <Box className="mb-8">
            <p className="text-md font-semibold text-gray-900 dark:text-gray-50 mb-3">
              {invoice.currency} {formatCurrency({ number: total })} paid on{' '}
              {invoice.paidDate ? format(invoice.paidDate, 'MMM dd, yyyy') : 'N/A'}
            </p>
          </Box>

          {/* Items Table */}
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
                      Rate
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {invoice.items.map((item) => (
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

          {/* Summary Section */}
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
                <p className="text-base font-bold text-gray-900 dark:text-gray-50">Total Paid</p>
                <p className="text-base font-bold text-gray-900 dark:text-gray-50">
                  {formatCurrency({ number: total })}
                </p>
              </Box>
            </Box>
          </Box>

          {/* Payment History */}
          {invoice.payments && invoice.payments.length > 0 ? (
            <Box className="mb-8">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">Payment History</p>
              <Box className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Method</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Notes</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {invoice.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{format(payment.date, 'MMM dd, yyyy')}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{payment.method}</td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 text-xs italic">{payment.notes || '-'}</td>
                        <td className="px-4 py-2 text-sm font-medium text-right text-gray-900 dark:text-gray-100">
                          {formatCurrency({ number: payment.amount })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Box>
          ) : null}

          {/* Notes Section */}
          {invoice.notes ? (
            <Box className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-2">Notes:</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {invoice.notes}
              </p>
            </Box>
          ) : null}

          {/* Thank You Section */}
          <Box className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-2">
              Thank you for your business!
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This receipt confirms your payment has been received and processed.
            </p>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
