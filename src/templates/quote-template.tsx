'use client';

import { Document, Page, Text, View, StyleSheet, PDFViewer, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { lasFloresAccount } from '@/constants/data';
import { formatCurrency } from '@/lib/utils';
import { QuoteStatusSchema } from '@/zod/inputTypeSchemas/QuoteStatusSchema';
import type { QuoteWithDetails } from '@/features/finances/quotes/types';

type QuotePreviewProps = {
  quote: QuoteWithDetails;
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
    position: 'relative',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    position: 'absolute',
    top: -10,
    right: 0,
    width: 100,
    height: 100,
  },
  logo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  quoteNumber: {
    fontSize: 11,
    color: '#666',
  },
  billingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  billingColumn: {
    width: '48%',
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#666',
  },
  companyName: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  text: {
    fontSize: 10,
    color: '#333',
    marginBottom: 2,
  },
  dateSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  dateColumn: {
    width: '48%',
  },
  dateLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 3,
  },
  dateValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 10,
    fontWeight: 'bold',
    fontSize: 9,
    color: '#666',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableCol1: {
    width: '50%',
  },
  tableCol2: {
    width: '15%',
    textAlign: 'center',
  },
  tableCol3: {
    width: '20%',
    textAlign: 'right',
  },
  tableCol4: {
    width: '15%',
    textAlign: 'right',
  },
  summarySection: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
    width: '50%',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#666',
    flex: 1,
    textAlign: 'right',
    marginRight: 20,
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
    width: 80,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#333',
    width: '50%',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
    marginRight: 20,
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    width: 80,
    textAlign: 'right',
  },
  itemDetailsSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  itemDetailBox: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  itemDetailTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  itemDetailText: {
    fontSize: 9,
    color: '#666',
    lineHeight: 1.4,
  },
  attachmentsList: {
    marginTop: 8,
  },
  attachmentItem: {
    fontSize: 8,
    color: '#666',
    marginBottom: 3,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  imageContainer: {
    width: '48%',
    marginBottom: 8,
  },
  itemImage: {
    width: '100%',
    height: 150,
    objectFit: 'cover',
    borderRadius: 4,
    marginBottom: 4,
  },
  imageCaption: {
    fontSize: 7,
    color: '#666',
    textAlign: 'center',
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    marginBottom: 12,
  },
  colorBox: {
    width: 40,
    height: 40,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  notes: {
    marginTop: 30,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: '#666',
    lineHeight: 1.4,
  },
  termsSection: {
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
  },
  footerLine: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginBottom: 8,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerLeft: {
    fontSize: 8,
    color: '#999',
    textAlign: 'left',
  },
  footerRight: {
    fontSize: 8,
    color: '#999',
    textAlign: 'right',
  },
  pageNumber: {
    fontSize: 8,
    color: '#999',
    textAlign: 'center',
  },
  watermark: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 100,
    fontWeight: 'bold',
    color: 'rgba(0, 0, 0, 0.1)',
    transform: 'rotate(-45deg)',
    zIndex: -1,
  },
});

export function QuoteDocument({ quote }: QuotePreviewProps) {
  const subtotal = quote.items.reduce((sum, item) => sum + item.total, 0);
  const gstAmount = (subtotal * quote.gst) / 100;
  const total = subtotal + gstAmount - quote.discount;
  const isExpired = new Date() > new Date(quote.validUntil);

  // react-pdf/renderer only supports JPG and PNG images, not WebP
  const isSupportedImageFormat = (mimeType: string) => {
    return mimeType === 'image/jpeg' || mimeType === 'image/jpg' || mimeType === 'image/png';
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {quote.status === QuoteStatusSchema.enum.DRAFT ? (
          <View style={styles.watermark}>
            <Text>Draft</Text>
          </View>
        ) : null}
        {quote.status === QuoteStatusSchema.enum.EXPIRED || isExpired ? (
          <View style={styles.watermark}>
            <Text>Expired</Text>
          </View>
        ) : null}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Quote</Text>
            <Text style={styles.quoteNumber}>Quote Number #{quote.quoteNumber}</Text>
          </View>
          <View style={styles.headerRight}>
            <Image src="/static/logo-green-800.png" style={styles.logo} />
          </View>
        </View>

        {/* Billing Information */}
        <View style={styles.billingSection}>
          <View style={styles.billingColumn}>
            <Text style={styles.sectionTitle}>Quoted by:</Text>
            <Text style={styles.companyName}>{lasFloresAccount.accountName}</Text>
            <Text style={styles.text}>{lasFloresAccount.phone}</Text>
            <Text style={styles.text}>lasfloresmelb@gmail.com</Text>
            <Text style={styles.text}>AU ABN {lasFloresAccount.email}</Text>
          </View>
          <View style={styles.billingColumn}>
            <Text style={styles.sectionTitle}>Quoted to:</Text>
            <Text style={styles.companyName}>
              {quote.customer.firstName} {quote.customer.lastName}
            </Text>
            {quote.customer.phone && <Text style={styles.text}>{quote.customer.phone}</Text>}
            <Text style={styles.text}>{quote.customer.email}</Text>
            {quote.customer.organization && quote.customer.organization.name ? (
              <Text style={styles.text}>{quote.customer.organization.name}</Text>
            ) : null}
          </View>
        </View>

        {/* Dates */}
        <View style={styles.dateSection}>
          <View style={styles.dateColumn}>
            <Text style={styles.dateLabel}>Date Issued:</Text>
            <Text style={styles.dateValue}>{format(quote.issuedDate, 'MMMM dd, yyyy')}</Text>
          </View>
          <View style={styles.dateColumn}>
            <Text style={styles.dateLabel}>Valid Until:</Text>
            <Text style={styles.dateValue}>{format(quote.validUntil, 'MMMM dd, yyyy')}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <Text style={styles.sectionTitle}>Items</Text>

          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.tableCol1}>Items</Text>
            <Text style={styles.tableCol2}>QTY</Text>
            <Text style={styles.tableCol3}>Rate</Text>
            <Text style={styles.tableCol4}>Total</Text>
          </View>

          {/* Table Rows */}
          {quote.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.tableCol1}>{item.description}</Text>
              <Text style={styles.tableCol2}>{item.quantity}</Text>
              <Text style={styles.tableCol3}>{formatCurrency({ number: item.unitPrice })}</Text>
              <Text style={styles.tableCol4}>{formatCurrency({ number: item.total })}</Text>
            </View>
          ))}
        </View>

        {/* Item Details (colors, attachments and notes) */}
        {quote.items.some((item) => item.attachments?.length > 0 || item.notes || (item.colors && item.colors.length > 0)) ? (
          <View style={styles.itemDetailsSection} wrap={false}>
            <Text style={styles.sectionTitle}>Item Details</Text>
            {quote.items
              .filter((item) => item.attachments?.length > 0 || item.notes || (item.colors && item.colors.length > 0))
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <View key={item.id} style={styles.itemDetailBox}>
                  <Text style={styles.itemDetailTitle}>
                    {item.description}
                    {item.colors && item.colors.length > 0
                      ? ` (${item.colors.length} ${item.colors.length === 1 ? 'color' : 'colors'})`
                      : ''}
                    {item.attachments?.length > 0
                      ? ` (${item.attachments.length} ${item.attachments.length === 1 ? 'image' : 'images'})`
                      : ''}
                  </Text>

                  {/* Color Palette */}
                  {item.colors && item.colors.length > 0 ? (
                    <View style={styles.colorsGrid}>
                      {item.colors.map((color, colorIndex) => (
                        <View
                          key={`${item.id}-color-${colorIndex}`}
                          style={[styles.colorBox, { backgroundColor: color }]}
                        />
                      ))}
                    </View>
                  ) : null}

                  {item.attachments && item.attachments.length > 0 ? (
                    <>
                      <View style={styles.imagesGrid}>
                        {item.attachments
                          .filter((attachment) => isSupportedImageFormat(attachment.mimeType))
                          .map((attachment) => (
                            <View key={attachment.id} style={styles.imageContainer}>
                              <Image src={attachment.s3Url} style={styles.itemImage} />
                              <Text style={styles.imageCaption}>{attachment.fileName}</Text>
                            </View>
                          ))}
                      </View>
                      {item.attachments.some(
                        (attachment) => !isSupportedImageFormat(attachment.mimeType),
                      ) ? (
                        <Text style={styles.itemDetailText}>
                          Note: Some image formats (WebP) are not supported in PDF and have been
                          excluded.
                        </Text>
                      ) : null}
                    </>
                  ) : null}

                  {item.notes ? (
                    <Text style={styles.itemDetailText}>{item.notes.replace(/<[^>]*>/g, '')}</Text>
                  ) : null}
                </View>
              ))}
          </View>
        ) : null}

        {/* Summary Section */}
        <View style={styles.summarySection} wrap={false}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency({ number: subtotal })}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GST ({quote.gst}%)</Text>
            <Text style={styles.summaryValue}>{formatCurrency({ number: gstAmount })}</Text>
          </View>

          {quote.discount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={styles.summaryValue}>-{formatCurrency({ number: quote.discount })}</Text>
            </View>
          ) : null}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Quote Total</Text>
            <Text style={styles.totalValue}>{formatCurrency({ number: total })}</Text>
          </View>
        </View>

        {/* Notes */}
        {quote.notes ? (
          <View style={styles.notes} wrap={false}>
            <Text style={styles.notesTitle}>Notes:</Text>
            <Text style={styles.notesText}>{quote.notes}</Text>
          </View>
        ) : null}

        {/* Terms and Conditions */}
        {quote.terms ? (
          <View style={styles.termsSection} wrap={false}>
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
            <Text style={styles.notesText}>{quote.terms}</Text>
          </View>
        ) : (
          <View style={styles.termsSection} wrap={false}>
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
            <Text style={styles.notesText}>
              This quote is valid for the period specified above. Prices are in {quote.currency} and
              are subject to change after the expiration date. Acceptance of this quote constitutes
              agreement to these terms. Please retain this quote for your records.
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View style={styles.footerLine} />
          <View style={styles.footerContent}>
            <Text style={styles.footerLeft}>
              {quote.quoteNumber} · {formatCurrency({ number: total })} · Valid until{' '}
              {format(quote.validUntil, 'MMM d, yyyy')}
            </Text>
            <Text
              style={styles.footerRight}
              render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
            />
          </View>
        </View>
      </Page>
    </Document>
  );
}

export function QuotePdf({ quote }: QuotePreviewProps) {
  return (
    <PDFViewer width="100%" height="100%" className="border-0">
      <QuoteDocument quote={quote} />
    </PDFViewer>
  );
}
