'use client';

import { Box } from '@/components/ui/box';
import type {
  InvoiceMetadata,
  InvoiceItemDetail,
  InvoicePaymentItem,
} from '@/features/finances/invoices/types';
import { lasFloresAccount } from '@/constants/data';
import { InvoicePreviewHeader } from '@/features/finances/invoices/components/preview/invoice-preview-header';
import { InvoicePreviewBillingInfo } from '@/features/finances/invoices/components/preview/invoice-preview-billing-info';
import { InvoicePreviewItemsTable } from '@/features/finances/invoices/components/preview/invoice-preview-items-table';
import { InvoicePreviewSummary } from '@/features/finances/invoices/components/preview/invoice-preview-summary';
import { InvoicePreviewPayments } from '@/features/finances/invoices/components/preview/invoice-preview-payments';

const EMPTY_ITEMS: InvoiceItemDetail[] = [];
const EMPTY_PAYMENTS: InvoicePaymentItem[] = [];

type InvoiceHtmlPreviewProps = {
  invoice: InvoiceMetadata;
  items?: InvoiceItemDetail[];
  payments?: InvoicePaymentItem[];
  isLoadingItems?: boolean;
  isLoadingPayments?: boolean;
};

export function InvoicePreview({
  invoice,
  items = EMPTY_ITEMS,
  payments = EMPTY_PAYMENTS,
  isLoadingItems = false,
  isLoadingPayments = false,
}: InvoiceHtmlPreviewProps) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const gstAmount = (subtotal * invoice.gst) / 100;
  const total = subtotal + gstAmount - invoice.discount;

  return (
    <Box className="h-full overflow-y-auto bg-gray-100 dark:bg-gray-950 p-8">
      <Box className="bg-white dark:bg-gray-900 shadow-lg max-w-4xl mx-auto">
        <Box className="p-12">
          <InvoicePreviewHeader invoiceNumber={invoice.invoiceNumber} />

          <InvoicePreviewBillingInfo invoice={invoice} />

          <InvoicePreviewItemsTable items={items} isLoadingItems={isLoadingItems} />

          <InvoicePreviewSummary
            invoice={invoice}
            subtotal={subtotal}
            gstAmount={gstAmount}
            total={total}
          />

          <InvoicePreviewPayments payments={payments} isLoadingPayments={isLoadingPayments} />

          {/* Payment Details */}
          <Box className="grid gap-8 mb-8">
            <Box>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">
                Payment Details:
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-1">
                {lasFloresAccount.accountName}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Bank: {lasFloresAccount.bankName}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                BSB: {lasFloresAccount.bsb}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Account: {lasFloresAccount.accountNumber}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Reference: </strong>
                {invoice.invoiceNumber}
              </p>
            </Box>
          </Box>

          {/* Notes Section */}
          {invoice.notes ? (
            <Box className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-2">Notes:</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {invoice.notes}
              </p>
            </Box>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}
