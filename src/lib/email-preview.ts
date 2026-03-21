import { renderEmail, type EmailTemplateName, type EmailProps } from '@/emails';
import { env } from '@/env';

export type EmailPreviewData<T extends EmailTemplateName = EmailTemplateName> = {
  to: string;
  subject: string;
  template: T;
  props: EmailProps<T>;
  hasAttachment?: boolean;
  attachmentName?: string;
};

export type EmailPreviewResult =
  | {
      success: true;
      data: {
        to: string;
        subject: string;
        htmlContent: string;
        hasAttachment: boolean;
        attachmentName?: string;
        isTestMode: boolean;
        testRecipient?: string;
      };
    }
  | {
      success: false;
      error: string;
    };

/**
 * Get email recipient, overriding with test email if in test mode
 */
export function getEmailRecipient(originalRecipient: string): string {
  if (env.EMAIL_TEST_MODE && env.EMAIL_TEST_RECIPIENT) {
    return env.EMAIL_TEST_RECIPIENT;
  }
  return originalRecipient;
}

/**
 * Generate email preview HTML without sending
 * Generic utility that can be used across features (quotes, invoices, etc.)
 */
export async function generateEmailPreview<T extends EmailTemplateName>(
  emailData: EmailPreviewData<T>,
): Promise<EmailPreviewResult> {
  try {
    const isTestMode = Boolean(env.EMAIL_TEST_MODE && env.EMAIL_TEST_RECIPIENT);
    const recipient = getEmailRecipient(emailData.to);

    // Render the email template to HTML
    const htmlContent = await renderEmail(emailData.template, emailData.props);

    return {
      success: true,
      data: {
        to: recipient,
        subject: emailData.subject,
        htmlContent,
        hasAttachment: emailData.hasAttachment ?? false,
        attachmentName: emailData.attachmentName,
        isTestMode,
        testRecipient: isTestMode ? env.EMAIL_TEST_RECIPIENT : undefined,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate email preview',
    };
  }
}
