'use client';

import { format, differenceInDays } from 'date-fns';
import { FileIcon, Image as ImageIcon, Paperclip } from 'lucide-react';
import Image from 'next/image';
import { Box } from '@/components/ui/box';
import { formatCurrency } from '@/lib/utils';
import type { QuoteWithDetails } from '@/features/finances/quotes/types';
import { lasFloresAccount } from '@/constants/data';
import { formatFileSize, isImageFile } from '@/lib/file-constants';
import { RichTextEditor } from '@/components/rich-text-editor/rich-text-editor';


type QuoteHtmlPreviewProps = {
  quote: QuoteWithDetails;
};

export function QuotePreview({ quote }: QuoteHtmlPreviewProps) {
  const subtotal = quote.items.reduce((sum, item) => sum + item.total, 0);
  const gstAmount = (subtotal * quote.gst) / 100;
  const total = subtotal + gstAmount - quote.discount;
  const daysUntilExpiry = differenceInDays(new Date(quote.validUntil), new Date());
  const isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
  const isExpired = daysUntilExpiry < 0;

  return (
    <Box className="h-full overflow-y-auto bg-gray-100 dark:bg-gray-950 p-8">
      <Box className="bg-white dark:bg-gray-900 shadow-lg max-w-4xl mx-auto">
        {/* Quote Container */}
        <Box className="p-12">
          {/* Header */}
          <Box className="flex items-start justify-between mb-8">
            <Box>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-1">Quote</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Quote Number #{quote.quoteNumber}
              </p>
            </Box>
            <Box className="relative h-40 w-40">
              <Image
                src="/static/logo-green-800.png"
                alt="Las Flores Melbourne Logo"
                width={160}
                height={160}
                className="h-40 w-auto object-contain"
                priority
              />
            </Box>
          </Box>

          {/* Billing Information */}
          <Box className="grid grid-cols-2 gap-8 mb-8">
            <Box>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">
                Quoted by:
              </p>
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
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">
                Quoted to:
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-1">
                {quote.customer.firstName} {quote.customer.lastName}
              </p>
              {quote.customer.phone && (
                <p className="text-sm text-gray-700 dark:text-gray-300">{quote.customer.phone}</p>
              )}
              <p className="text-sm text-gray-700 dark:text-gray-300">{quote.customer.email}</p>
              {quote.customer.organization && quote.customer.organization.name ? (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {quote.customer.organization.name}
                </p>
              ) : null}
            </Box>
          </Box>

          {/* Dates */}
          <Box className="grid grid-cols-2 gap-8 mb-8">
            <Box>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Date Issued:</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                {format(quote.issuedDate, 'MMMM dd, yyyy')}
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
                {format(quote.validUntil, 'MMMM dd, yyyy')}
              </p>
            </Box>
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
                      Cost
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {quote.items.map((item) => (
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
                <p className="text-sm text-gray-600 dark:text-gray-400">GST ({quote.gst}%)</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                  {formatCurrency({ number: gstAmount })}
                </p>
              </Box>

              {quote.discount > 0 ? (
                <Box className="flex justify-between items-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Discount</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                    -{formatCurrency({ number: quote.discount })}
                  </p>
                </Box>
              ) : null}

              <Box className="flex justify-between items-center pt-3 border-t-2 border-gray-900 dark:border-gray-50">
                <p className="text-base font-bold text-gray-900 dark:text-gray-50">Quote Total</p>
                <p className="text-base font-bold text-gray-900 dark:text-gray-50">
                  {formatCurrency({ number: total })}
                </p>
              </Box>
            </Box>
          </Box>

          {/* Item Images and Notes Section */}
          {quote.items.some((item) => item.attachments.length > 0 || item.notes || (item.colors && item.colors.length > 0)) && (
            <Box className="mb-8">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">
                Item Details
              </p>
              <Box className="space-y-6">
                {quote.items
                  .filter((item) => item.attachments.length > 0 || item.notes || (item.colors && item.colors.length > 0))
                  .sort((a, b) => a.order - b.order)
                  .map((item) => (
                    <Box
                      key={item.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                    >
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-3">
                        {item.description}
                        {item.colors && item.colors.length > 0 ? (
                          <span className="text-xs font-normal text-gray-500 dark:text-gray-500 ml-2">
                            ({item.colors.length}{' '}
                            {item.colors.length === 1 ? 'color' : 'colors'})
                          </span>
                        ) : null}

                        {item.attachments.length > 0 ? (
                          <span className="text-xs font-normal text-gray-500 dark:text-gray-500 ml-2">
                            ({item.attachments.length}{' '}
                            {item.attachments.length === 1 ? 'image' : 'images'})
                          </span>
                        ) : null}                        
                      </h4>

                      {/* Color Palette */}
                      {item.colors && item.colors.length > 0 ? (
                        <Box className="flex flex-wrap gap-2 mb-4">
                          {item.colors.map((color, colorIndex) => (
                            <Box
                              key={`${item.id}-color-${colorIndex}`}
                              className="w-16 h-16 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </Box>
                      ): null}

                      {/* Item Images Grid */}
                      {item.attachments.length > 0 ? (
                        <Box className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 mb-4">
                          {item.attachments.map((attachment) => (
                            <Box
                              key={attachment.id}
                              className="relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900"
                            >
                              <Box className="aspect-square bg-gray-100 dark:bg-gray-800 relative">
                                <Image
                                  src={attachment.s3Url}
                                  alt={attachment.fileName}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                />
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      ) : null}

                      {/* Item Notes - Show when colors, images, or notes exist */}
                      {item.notes ? (
                        <RichTextEditor
                          key={`editor-readonly-${item.id}`}
                          value={item.notes ?? ''}
                          editable={false}
                        />
                      ) : null}
                    </Box>
                  ))}
              </Box>
            </Box>
          )}          

          {/* Notes Section */}
          {quote.notes ? (
            <Box className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-2">Notes:</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {quote.notes}
              </p>
            </Box>
          ) : null}

          {/* Terms & Conditions */}
          <Box className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-3">
              Terms & Conditions
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {quote.terms ||
                `This quote is valid for the period specified above. Prices are in ${quote.currency} and are subject to change after the expiration date. Acceptance of this quote constitutes agreement to these terms. Please retain this quote for your records.`}
            </p>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
