/**
 * Email Template Registry
 *
 * Centralized registry for all email templates with type safety.
 */

import React from 'react';
import { render } from '@react-email/render';

// Import all email templates
import { InvoiceEmail } from './invoice-email';
import { ReceiptEmail } from './receipt-email';
import { ReminderEmail } from './reminder-email';
import { QuoteEmail } from './quote-email';
import { QuoteFollowUpEmail } from './quote-followup-email';

// Export types for template props
export type { InvoiceEmail as InvoiceEmailComponent } from './invoice-email';
export type { ReceiptEmail as ReceiptEmailComponent } from './receipt-email';
export type { ReminderEmail as ReminderEmailComponent } from './reminder-email';
export type { QuoteEmail as QuoteEmailComponent } from './quote-email';
export type { QuoteFollowUpEmail as QuoteFollowUpEmailComponent } from './quote-followup-email';

/**
 * Registry of all available email templates
 */
const emailTemplates = {
  invoice: InvoiceEmail,
  receipt: ReceiptEmail,
  reminder: ReminderEmail,
  quote: QuoteEmail,
  'quote-followup': QuoteFollowUpEmail,
} as const;

/**
 * Get all template names as an array
 */
export const emailTemplateKeys = Object.keys(emailTemplates) as EmailTemplateName[];

/**
 * Union type of all template names
 */
export type EmailTemplateName = keyof typeof emailTemplates;

/**
 * Extract props type for a specific template
 */
export type EmailProps<T extends EmailTemplateName> = Parameters<(typeof emailTemplates)[T]>[0];

/**
 * Template configuration type
 */
export type Template<T extends EmailTemplateName> = {
  name: T;
  props: EmailProps<T>;
};

/**
 * Type guard to check if a string is a valid template name
 */
export function isEmailTemplate(name: unknown): name is EmailTemplateName {
  for (const key of emailTemplateKeys) {
    if (name === key) {
      return true;
    }
  }
  return false;
}

/**
 * Get a template component by name
 */
function getTemplate<N extends EmailTemplateName>(
  key: N,
): React.ComponentType<EmailProps<N>> | undefined {
  const Email = emailTemplates[key];
  if (Email == null) {
    return undefined;
  }

  return Email as unknown as React.ComponentType<EmailProps<N>>;
}

/**
 * Render an email template to HTML string
 *
 * @param key - Template name
 * @param props - Props for the template
 * @returns HTML string of the rendered email
 */
export async function renderEmail<
  T extends EmailTemplateName,
  Component extends (typeof emailTemplates)[T],
  Props extends Parameters<Component>[0],
>(key: T, props: Props): Promise<string> {
  const Email = getTemplate(key);

  if (Email === undefined) {
    throw new Error(`Email template "${key}" not found.`);
  }

  return render(<Email {...props} />, {
    pretty: true,
  });
}
