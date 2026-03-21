'use client';

import { format } from 'date-fns';
import { Box } from '@/components/ui/box';
import { lasFloresAccount } from '@/constants/data';
import type { InvoiceMetadata } from '@/features/finances/invoices/types';

interface InvoicePreviewBillingInfoProps {
  invoice: InvoiceMetadata;
}

export function InvoicePreviewBillingInfo({ invoice }: InvoicePreviewBillingInfoProps) {
  return (
    <>
      {/* Billing Information */}
      <Box className="grid grid-cols-2 gap-8 mb-8">
        <Box>
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">Billed by:</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-1">
            {lasFloresAccount.accountName}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{lasFloresAccount.phone}</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{lasFloresAccount.email}</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">AU ABN {lasFloresAccount.abn}</p>
        </Box>
        <Box>
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">Billed to:</p>
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

      {/* Dates */}
      <Box className="grid grid-cols-2 gap-8 mb-8">
        <Box>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Date Issued:</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
            {format(invoice.issuedDate, 'MMMM dd, yyyy')}
          </p>
        </Box>
        <Box>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Due Date:</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
            {format(invoice.dueDate, 'MMMM dd, yyyy')}
          </p>
        </Box>
      </Box>
    </>
  );
}
