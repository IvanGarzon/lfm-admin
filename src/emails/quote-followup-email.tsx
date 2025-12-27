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

type QuoteFollowUpEmailProps = {
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
};

export const QuoteFollowUpContent = ({ quoteData, pdfUrl }: QuoteFollowUpEmailProps) => {
  const { quoteNumber, customerName, amount, currency, issuedDate, validUntil, itemCount } = quoteData;

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
      <Heading style={styles.h1}>Following Up on Your Quote</Heading>

      <Text style={styles.text}>Hi {customerName},</Text>

      <Text style={styles.text}>
        We wanted to follow up on Quote <strong>{quoteNumber}</strong> that we sent to you.
        We hope you've had a chance to review it and would love to answer any questions you might have.
      </Text>

      <Text style={styles.text}>
        At Las Flores Melbourne, we're committed to creating beautiful floral arrangements
        that bring your vision to life. Our team is here to help with any customizations or
        adjustments you might need.
      </Text>

      <Hr style={styles.hr} />

      <Section style={styles.receiptDetails}>
        <table style={styles.tableStyle}>
          <tbody>
            <tr>
              <td style={styles.labelCell}>Quote Number:</td>
              <td style={styles.valueCell}>#{quoteNumber}</td>
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
              <td style={styles.valueCell}>{itemCount} {itemCount === 1 ? 'item' : 'items'}</td>
            </tr>
            <tr>
              <td style={styles.labelCell}>Total Amount:</td>
              <td style={styles.amountCell}>{formattedAmount}</td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Hr style={styles.hr} />

      {pdfUrl ? (
        <Section style={styles.buttonContainer}>
          <Button style={styles.button} href={pdfUrl}>
            View Quote PDF
          </Button>
        </Section>
      ) : null}

      <Text style={styles.text}>
        If you have any questions about the quote or would like to discuss modifications,
        please don't hesitate to reach out. We're here to help!
      </Text>

      <Text style={styles.text}>
        We look forward to working with you to create something beautiful.
      </Text>

      <Text style={styles.footer}>
        Best regards,
        <br />
        The Las Flores Melbourne Team
      </Text>
    </>
  );
};

export function QuoteFollowUpEmail(props: QuoteFollowUpEmailProps): React.ReactElement {
  return (
    <BaseTemplateEmail previewText={`Following up on Quote ${props.quoteData.quoteNumber} from Las Flores Melbourne`}>
      <QuoteFollowUpContent {...props} />
    </BaseTemplateEmail>
  );
}

QuoteFollowUpEmail.PreviewProps = {
  quoteData: {
    quoteNumber: 'QT-2025-001',
    customerName: 'Sarah Johnson',
    amount: 850.0,
    currency: 'AUD',
    issuedDate: new Date('2025-01-15'),
    validUntil: new Date('2025-02-15'),
    itemCount: 3,
  },
  pdfUrl: 'https://example.com/quote.pdf',
} satisfies QuoteFollowUpEmailProps;

export default QuoteFollowUpEmail;
