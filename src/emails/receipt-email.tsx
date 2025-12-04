import {
  Button,
  Heading,
  Hr,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { BaseTemplateEmail } from './base-template';
import { styles } from './styles';

interface ReceiptEmailProps {
  receiptData: {
    invoiceNumber: string;
    receiptNumber?: string;
    customerName: string;
    amount: number;
    currency: string;
    paidDate: Date;
    paymentMethod: string;
  };
  pdfUrl?: string;
}

function ReceiptContent({ receiptData, pdfUrl }: ReceiptEmailProps): React.ReactElement {
  const { invoiceNumber, receiptNumber, customerName, amount, currency, paidDate, paymentMethod } = receiptData;

  return (
    <>
      <Heading style={styles.h1}>Payment Received</Heading>

      <Text style={styles.text}>Hello {customerName},</Text>

      <Text style={styles.text}>
        Thank you for your payment! We have successfully received your payment for Invoice{' '}
        {invoiceNumber}.
      </Text>

      <Section style={styles.receiptDetails}>
        <table style={styles.tableStyle}>
          <tbody>
            <tr>
              <td style={styles.labelCell}>Receipt Number:</td>
              <td style={styles.valueCell}>{receiptNumber || invoiceNumber}</td>
            </tr>
            <tr>
              <td style={styles.labelCell}>Payment Date:</td>
              <td style={styles.valueCell}>{format(paidDate, 'MMM dd, yyyy')}</td>
            </tr>
            <tr>
              <td style={styles.labelCell}>Payment Method:</td>
              <td style={styles.valueCell}>{paymentMethod}</td>
            </tr>
            <tr>
              <td style={styles.labelCell}>Amount Paid:</td>
              <td style={styles.amountCell}>{formatCurrency({ number: amount, currency })}</td>
            </tr>
          </tbody>
        </table>
      </Section>

      {pdfUrl ? (
        <Section style={styles.buttonContainer}>
          <Button style={styles.button} href={pdfUrl}>
            Download Receipt PDF
          </Button>
        </Section>
      ): null}

      <Hr style={styles.hr} />

      <Text style={styles.footer}>
        This is an automated receipt. Please keep this for your records.
      </Text>

      <Text style={styles.footer}>
        If you have any questions, please don't hesitate to contact us.
      </Text>

      <Text style={styles.footer}>
        Thank you for your business!
      </Text>
    </>
  );
}

export function ReceiptEmail(props: ReceiptEmailProps): React.ReactElement {
  return (
    <BaseTemplateEmail previewText={`Payment Receipt ${props.receiptData.receiptNumber || props.receiptData.invoiceNumber}`}>
      <ReceiptContent {...props} />
    </BaseTemplateEmail>
  );
}

