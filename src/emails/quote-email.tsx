import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import * as React from 'react';
import { BaseTemplateEmail } from './base-template';
import { styles } from './styles';

interface QuoteEmailProps {
  quoteData: {
    quoteNumber: string;
    customerName: string;
    amount: number;
    currency: string;
    issuedDate: Date;
    validUntil: Date;
    itemCount: number;
  };
  pdfUrl?: string;
}

export const QuoteContent = ({ quoteData, pdfUrl }: QuoteEmailProps) => {
  const { quoteNumber, customerName, amount, currency, issuedDate, validUntil, itemCount } =
    quoteData;

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);

  const formattedIssuedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(issuedDate));

  const formattedValidUntil = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(validUntil));

  return (
    <>
      <Heading style={styles.h1}>Quote {quoteNumber}</Heading>

      <Text style={styles.text}>Hello {customerName},</Text>

      <Text style={styles.text}>
        Thank you for your interest in our services. Please find your quote details below:
      </Text>

      <Section style={styles.receiptDetails}>
        <table style={styles.tableStyle}>
          <tbody>
            <tr>
              <td style={styles.labelCell}>Quote Number:</td>
              <td style={styles.valueCell}>{quoteNumber}</td>
            </tr>
            <tr>
              <td style={styles.labelCell}>Issue Date:</td>
              <td style={styles.valueCell}>{formattedIssuedDate}</td>
            </tr>
            <tr>
              <td style={styles.labelCell}>Valid Until:</td>
              <td style={styles.valueCell}>{formattedValidUntil}</td>
            </tr>
            <tr>
              <td style={styles.labelCell}>Items:</td>
              <td style={styles.valueCell}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </td>
            </tr>
            <tr>
              <td style={styles.labelCell}>Total Amount:</td>
              <td style={styles.amountCell}>{formattedAmount}</td>
            </tr>
          </tbody>
        </table>
      </Section>

      {pdfUrl ? (
        <Section style={styles.buttonContainer}>
          <Button style={styles.button} href={pdfUrl}>
            View Quote PDF
          </Button>
        </Section>
      ) : null}

      <Hr style={styles.hr} />

      <Text style={styles.footer}>
        This quote is valid until {formattedValidUntil}. Please review and let us know if you have
        any questions.
      </Text>

      <Text style={styles.footer}>We look forward to working with you!</Text>
    </>
  );
};

export function QuoteEmail(props: QuoteEmailProps): React.ReactElement {
  return (
    <BaseTemplateEmail
      previewText={`Quote ${props.quoteData.quoteNumber} - Total: ${props.quoteData.amount}`}
    >
      <QuoteContent {...props} />
    </BaseTemplateEmail>
  );
}

QuoteEmail.PreviewProps = {
  quoteData: {
    quoteNumber: 'QT-2025-001',
    customerName: 'Sarah Johnson',
    amount: 1250.0,
    currency: 'AUD',
    issuedDate: new Date('2025-01-15'),
    validUntil: new Date('2025-02-15'),
    itemCount: 5,
  },
  pdfUrl: 'https://example.com/quote.pdf',
} satisfies QuoteEmailProps;

export default QuoteEmail;
