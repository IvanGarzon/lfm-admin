/**
 * Email Service
 *
 * Centralized service for sending emails using Resend.
 * Supports type-safe template rendering with the email template registry.
 *
 * Usage:
 * ```typescript
 * import { sendEmailNotification } from '@/lib/email-service';
 *
 * await sendEmailNotification({
 *   to: 'customer@example.com',
 *   subject: 'Your Invoice',
 *   template: 'invoice',
 *   props: {
 *     invoiceData: {...},
 *     pdfUrl: '...'
 *   }
 * });
 * ```
 */

import { Resend } from 'resend';
import { env } from '@/env';
import { logger } from '@/lib/logger';
import { renderEmail, type EmailTemplateName, type EmailProps } from '@/emails';

// Initialize Resend with API key
const resend = new Resend(env.RESEND_API_KEY);

/**
 * Email service configuration
 */
const EMAIL_CONFIG = {
  from: env.NEXT_PUBLIC_APP_URL.includes('localhost')
    ? 'onboarding@resend.dev' // Resend test email for development
    : 'noreply@yourdomain.com', // Replace with your actual domain
  replyTo: 'support@yourdomain.com', // Replace with your support email
} as const;

/**
 * Email attachment type
 */
export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

/**
 * Send email notification with type-safe template rendering
 *
 * @param options - Email options
 * @param options.to - Recipient email address(es)
 * @param options.subject - Email subject line
 * @param options.template - Template name from email registry
 * @param options.props - Props for the template (type-safe based on template)
 * @param options.replyTo - Optional reply-to address (overrides default)
 * @param options.attachments - Optional file attachments
 * @returns Promise with email sending result
 */
export async function sendEmailNotification<T extends EmailTemplateName>({
  to,
  subject,
  template,
  props,
  replyTo,
  attachments,
}: {
  to: string | string[];
  subject: string;
  template: T;
  props: EmailProps<T>;
  replyTo?: string;
  attachments?: EmailAttachment[];
}) {
  try {
    // Render the email template to HTML
    const html = await renderEmail(template, props);

    // Prepare attachments for Resend
    const resendAttachments = attachments?.map((att) => ({
      filename: att.filename,
      content: att.content,
      ...(att.contentType && { type: att.contentType }),
    }));

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: 'ivangarzoncruz@gmail.com',
      subject,
      html,
      replyTo: replyTo || EMAIL_CONFIG.replyTo,
      ...(resendAttachments && { attachments: resendAttachments }),
    });

    if (error) {
      logger.error('Failed to send email', error, {
        context: 'email-service',
        metadata: { to, subject, template, attachmentCount: attachments?.length || 0 },
      });

      throw new Error(`Email sending failed: ${error.message}`);
    }

    logger.info('Email sent successfully', {
      context: 'email-service',
      metadata: {
        to,
        subject,
        template,
        emailId: data?.id,
        attachmentCount: attachments?.length || 0,
      },
    });

    return { success: true, emailId: data?.id };
  } catch (error) {
    logger.error('Unexpected error sending email', error, {
      context: 'email-service',
      metadata: { template },
    });

    throw error;
  }
}
