import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { lasFloresAccount } from '@/constants/data';
import { formatCurrency } from '@/lib/utils';
import type { InvoiceWithDetails } from '@/features/finances/invoices/types';

type ReceiptPreviewProps = {
  invoice: InvoiceWithDetails;
  logoUrl?: string;
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
    marginBottom: 10,
  },
  paymentHeaderRow: {
    flexDirection: 'row',
    fontSize: 9,
    marginBottom: 2,
  },
  labelHeader: {
    fontWeight: 'bold',
    color: '#333',
    width: 100,
  },
  subtitleHeader: {
    color: '#666',
    flex: 1,
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
  paymentInfoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  paymentInfoLabel: {
    fontSize: 9,
    color: '#666',
    width: 100,
  },
  paymentInfoValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentSummary: {
    marginBottom: 30,
  },
  paymentSummaryText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
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
  paymentHistorySection: {
    marginTop: 20,
    marginBottom: 20,
  },
  paymentHistoryTable: {
    marginTop: 10,
  },
  paymentHistoryHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 9,
    color: '#666',
  },
  paymentHistoryRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  paymentCol1: {
    width: '25%',
  },
  paymentCol2: {
    width: '25%',
  },
  paymentCol3: {
    width: '30%',
  },
  paymentCol4: {
    width: '20%',
    textAlign: 'right',
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
  thankYouSection: {
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    textAlign: 'center',
  },
  thankYouText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  thankYouSubtext: {
    fontSize: 9,
    color: '#666',
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
});

export function ReceiptDocument({ invoice, logoUrl }: ReceiptPreviewProps) {
  const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
  const gstAmount = (subtotal * invoice.gst) / 100;
  const total = subtotal + gstAmount - invoice.discount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Receipt</Text>
            <View style={styles.paymentHeaderRow}>
              <Text style={styles.labelHeader}>Receipt Number: </Text>
              <Text style={styles.subtitleHeader}>#{invoice.receiptNumber || invoice.invoiceNumber}</Text>
            </View>
            <View style={styles.paymentHeaderRow}>
              <Text style={styles.labelHeader}>Payment Method: </Text>
              <Text style={styles.subtitleHeader}>{invoice.paymentMethod || 'N/A'}</Text>
            </View>
            <View style={styles.paymentHeaderRow}>
              <Text style={styles.labelHeader}>Payment Date: </Text>
              <Text style={styles.subtitleHeader}>
                {invoice.paidDate ? format(invoice.paidDate, 'MMM dd, yyyy') : 'N/A'}
              </Text>
            </View>
            <View style={styles.paymentHeaderRow}>
              <Text style={styles.labelHeader}>Amount Paid: </Text>
              <Text style={styles.subtitleHeader}>{formatCurrency({ number: total })}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Image src={logoUrl || "/static/logo-green-800.png"} style={styles.logo} />
          </View>
        </View>

        {/* Billing Information */}
        <View style={styles.billingSection}>
          <View style={styles.billingColumn}>
            <Text style={styles.companyName}>{lasFloresAccount.accountName}</Text>
            <Text style={styles.text}>{lasFloresAccount.phone}</Text>
            <Text style={styles.text}>{lasFloresAccount.email}</Text>
            <Text style={styles.text}>AU ABN {lasFloresAccount.abn}</Text>
          </View>
          <View style={styles.billingColumn}>
            <Text style={styles.sectionTitle}>Bill to:</Text>
            <Text style={styles.companyName}>
              {invoice.customer.firstName} {invoice.customer.lastName}
            </Text>
            {invoice.customer.phone && <Text style={styles.text}>{invoice.customer.phone}</Text>}
            <Text style={styles.text}>{invoice.customer.email}</Text>
            {invoice.customer.organization && invoice.customer.organization.name ? (
              <Text style={styles.text}>{invoice.customer.organization.name}</Text>
            ) : null}
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.paymentInfoRow}>
          <Text style={styles.paymentSummaryText}>
            {invoice.currency} {formatCurrency({ number: total })} paid on{' '}
            {invoice.paidDate ? format(invoice.paidDate, 'MMM dd, yyyy') : 'N/A'}
          </Text>
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
          {invoice.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.tableCol1}>{item.description}</Text>
              <Text style={styles.tableCol2}>{item.quantity}</Text>
              <Text style={styles.tableCol3}>{formatCurrency({ number: item.unitPrice })}</Text>
              <Text style={styles.tableCol4}>{formatCurrency({ number: item.total })}</Text>
            </View>
          ))}
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection} wrap={false}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency({ number: subtotal })}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GST ({invoice.gst}%)</Text>
            <Text style={styles.summaryValue}>{formatCurrency({ number: gstAmount })}</Text>
          </View>

          {invoice.discount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={styles.summaryValue}>
                -{formatCurrency({ number: invoice.discount })}
              </Text>
            </View>
          ) : null}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>{formatCurrency({ number: total })}</Text>
          </View>
        </View>

        {/* Payment History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <View style={styles.paymentHistorySection} wrap={false}>
            <Text style={styles.sectionTitle}>Payment History</Text>
            <View style={styles.paymentHistoryTable}>
              {/* Table Header */}
              <View style={styles.paymentHistoryHeader}>
                <Text style={styles.paymentCol1}>Date</Text>
                <Text style={styles.paymentCol2}>Method</Text>
                <Text style={styles.paymentCol3}>Notes</Text>
                <Text style={styles.paymentCol4}>Amount</Text>
              </View>

              {/* Table Rows */}
              {invoice.payments.map((payment) => (
                <View key={payment.id} style={styles.paymentHistoryRow}>
                  <Text style={styles.paymentCol1}>{format(payment.date, 'MMM dd, yyyy')}</Text>
                  <Text style={styles.paymentCol2}>{payment.method}</Text>
                  <Text style={styles.paymentCol3}>{payment.notes || '-'}</Text>
                  <Text style={styles.paymentCol4}>{formatCurrency({ number: payment.amount })}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Notes */}
        {invoice.notes ? (
          <View style={styles.notes} wrap={false}>
            <Text style={styles.notesTitle}>Notes:</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        ) : null}

        {/* Thank You Section */}
        <View style={styles.thankYouSection} wrap={false}>
          <Text style={styles.thankYouText}>Thank you for your business!</Text>
          <Text style={styles.thankYouSubtext}>
            This receipt confirms your payment has been received and processed.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View style={styles.footerLine} />
          <View style={styles.footerContent}>
            <Text style={styles.footerLeft}>
              Receipt #{invoice.receiptNumber || invoice.invoiceNumber} · {formatCurrency({ number: total })} paid on{' '}
              {invoice.paidDate ? format(invoice.paidDate, 'MMM d, yyyy') : 'N/A'}
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