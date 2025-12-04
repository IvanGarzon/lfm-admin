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

interface ReminderEmailProps {
  reminderData: {
    invoiceNumber: string;
    customerName: string;
    amount: number;
    currency: string;
    dueDate: Date;
    daysOverdue: number;
  };
  pdfUrl?: string;
}

const overdueCell = {
  ...styles.valueCell,
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#ef4444',
};

export const ReminderContent = ({ reminderData, pdfUrl }: ReminderEmailProps) => {
  const { invoiceNumber, customerName, amount, currency, dueDate, daysOverdue } = reminderData;

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);

  const formattedDueDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dueDate));

  return (
    <>
      <Heading style={styles.h1}>Payment Reminder</Heading>

      <Text style={styles.text}>Hello {customerName},</Text>

      <Text style={styles.text}>
        This is a friendly reminder that Invoice {invoiceNumber} is now {daysOverdue} day{daysOverdue > 1 ? 's' : ''} overdue.
      </Text>

      <Section style={styles.receiptDetails}>
        <table style={styles.tableStyle}>
          <tbody>
            <tr>
              <td style={styles.labelCell}>Invoice Number:</td>
              <td style={styles.valueCell}>{invoiceNumber}</td>
            </tr>
            <tr>
              <td style={styles.labelCell}>Original Due Date:</td>
              <td style={styles.valueCell}>{formattedDueDate}</td>
            </tr>
            <tr>
              <td style={styles.labelCell}>Days Overdue:</td>
              <td style={overdueCell}>{daysOverdue} day{daysOverdue > 1 ? 's' : ''}</td>
            </tr>
            <tr>
              <td style={styles.labelCell}>Amount Due:</td>
              <td style={styles.amountCell}>{formattedAmount}</td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Text style={styles.text}>
        Please submit your payment as soon as possible to avoid any late fees or service interruptions.
      </Text>

      {pdfUrl ? (
        <Section style={styles.buttonContainer}>
          <Button style={styles.button} href={pdfUrl}>
            View Invoice PDF
          </Button>
        </Section>
      ): null}

      <Hr style={styles.hr} />

      <Text style={styles.footer}>
        If you have already sent payment, please disregard this reminder.
      </Text>

      <Text style={styles.footer}>
        If you have any questions or need to discuss payment arrangements, please contact us immediately.
      </Text>

      <Text style={styles.footer}>
        Thank you for your prompt attention to this matter.
      </Text>
    </>
  );
};

export function ReminderEmail(props: ReminderEmailProps): React.ReactElement {
  return (
    <BaseTemplateEmail previewText={`Payment Reminder: Invoice ${props.reminderData.invoiceNumber} is ${props.reminderData.daysOverdue} days overdue`}>
      <ReminderContent {...props} />
    </BaseTemplateEmail>
  );
}

