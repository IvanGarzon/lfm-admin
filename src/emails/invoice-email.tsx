import {
  Button,
  Heading,
  Hr,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { BaseTemplateEmail } from './base-template';
import { styles } from './styles';

interface InvoiceEmailProps {
  invoiceData: {
    invoiceNumber: string;
    customerName: string;
    amount: number;
    currency: string;
    dueDate: Date;
    issuedDate: Date;
  };
  pdfUrl?: string;
}

export const InvoiceContent = ({ invoiceData, pdfUrl }: InvoiceEmailProps) => {
  const { invoiceNumber, customerName, amount, currency, dueDate, issuedDate } = invoiceData;

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);

  const formattedDueDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dueDate));

  const formattedIssuedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(issuedDate));

  return (
    <>
      <Heading style={styles.h1}>Invoice {invoiceNumber}</Heading>

      <Text style={styles.text}>Hello {customerName},</Text>

      <Text style={styles.text}>
        Thank you for your business. Please find your invoice details below:
      </Text>

      <Section style={styles.receiptDetails}>
        <table style={styles.tableStyle}>
          <tbody>
            <tr>
              <td style={styles.labelCell}>Invoice Number:</td>
              <td style={styles.valueCell}>{invoiceNumber}</td>
            </tr>
            <tr>
              <td style={styles.labelCell}>Issue Date:</td>
              <td style={styles.valueCell}>{formattedIssuedDate}</td>
            </tr>
            <tr>
              <td style={styles.labelCell}>Due Date:</td>
              <td style={styles.valueCell}>{formattedDueDate}</td>
            </tr>
            <tr>
              <td style={styles.labelCell}>Amount Due:</td>
              <td style={styles.amountCell}>{formattedAmount}</td>
            </tr>
          </tbody>
        </table>
      </Section>

      {pdfUrl ? (
        <Section style={styles.buttonContainer}>
          <Button style={styles.button} href={pdfUrl}>
            View Invoice PDF
          </Button>
        </Section>
      ): null}

      <Hr style={styles.hr} />

      <Text style={styles.footer}>
        If you have any questions about this invoice, please don't hesitate to contact us.
      </Text>

      <Text style={styles.footer}>
        Thank you for your business!
      </Text>
    </>
  );
};

export function InvoiceEmail(props: InvoiceEmailProps): React.ReactElement {
  return (
    <BaseTemplateEmail previewText={`Invoice ${props.invoiceData.invoiceNumber} - Amount Due: ${props.invoiceData.amount}`}>
      <InvoiceContent {...props} />
    </BaseTemplateEmail>
  );
}
