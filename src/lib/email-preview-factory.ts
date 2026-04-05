import { generateEmailPreview, type EmailPreviewResult } from '@/lib/email-preview';
import { auth } from '@/auth';
import { getTenantBranding } from '@/actions/tenant/queries';
import type { EmailTemplateName } from '@/emails';

/**
 * Configuration for a specific email type
 */
interface EmailTypeConfig {
  /**
   * Email subject line
   */
  subject: string;

  /**
   * Email template name
   */
  template: EmailTemplateName;

  /**
   * Props to pass to the email template
   */
  props: unknown;

  /**
   * Whether this email includes a PDF attachment
   */
  hasAttachment: boolean;

  /**
   * Attachment filename (if hasAttachment is true)
   */
  attachmentName?: string;
}

/**
 * Configuration for creating an entity email preview function
 */
interface EmailPreviewFactoryConfig<TEntity, TEmailType extends string> {
  /**
   * Name of the entity (for error messages)
   * @example 'Invoice', 'Quote'
   */
  entityName: string;

  /**
   * Function to fetch entity by ID, scoped to a tenant.
   */
  fetchEntity: (id: string, tenantId: string) => Promise<TEntity | null>;

  /**
   * Function to get the customer email from the entity
   */
  getCustomerEmail: (entity: TEntity) => string;

  /**
   * Function to build email configuration based on entity, email type, and tenant name.
   * The tenant name is resolved from TenantSettings at preview time.
   */
  buildEmailConfig: (
    entity: TEntity,
    emailType: TEmailType,
    tenantName: string,
  ) => EmailTypeConfig | { error: string };
}

/**
 * Factory function to create a type-safe email preview function for any entity
 *
 * Eliminates duplication between invoice and quote email preview implementations
 * by extracting the common pattern:
 * 1. Fetch entity
 * 2. Validate entity exists
 * 3. Get customer email
 * 4. Build email configuration
 * 5. Generate preview
 * 6. Handle errors
 *
 * @example
 * ```typescript
 * export const previewInvoiceEmail = createEmailPreviewFunction({
 *   entityName: 'Invoice',
 *   fetchEntity: (id) => invoiceRepository.findByIdMetadata(id),
 *   getCustomerEmail: (invoice) => invoice.customer.email,
 *   buildEmailConfig: (invoice, type) => {
 *     switch (type) {
 *       case 'sent':
 *         return {
 *           subject: `Invoice ${invoice.invoiceNumber}`,
 *           template: 'invoice',
 *           props: { invoiceData: {...} },
 *           hasAttachment: true,
 *         };
 *       // ... more cases
 *     }
 *   },
 * });
 * ```
 */
export function createEmailPreviewFunction<TEntity, TEmailType extends string>(
  config: EmailPreviewFactoryConfig<TEntity, TEmailType>,
) {
  const { entityName, fetchEntity, getCustomerEmail, buildEmailConfig } = config;

  return async function previewEmail(
    entityId: string,
    emailType: TEmailType,
  ): Promise<EmailPreviewResult> {
    try {
      // Step 1: Resolve tenant from session and fetch branding in parallel
      const [session, branding] = await Promise.all([auth(), getTenantBranding()]);
      if (!session?.user?.tenantId) {
        return { success: false, error: 'No tenant context found for this session' };
      }

      // Step 2: Fetch entity scoped to tenant
      const entity = await fetchEntity(entityId, session.user.tenantId);

      // Step 3: Validate entity exists
      if (!entity) {
        return {
          success: false,
          error: `${entityName} not found`,
        };
      }

      // Step 4: Get customer email
      const customerEmail = getCustomerEmail(entity);

      // Step 5: Build email configuration
      const tenantName = branding?.name ?? '';
      const emailConfig = buildEmailConfig(entity, emailType, tenantName);

      // Check if buildEmailConfig returned an error
      if ('error' in emailConfig) {
        return {
          success: false,
          error: emailConfig.error,
        };
      }

      // Step 6: Generate preview
      // Type assertion is safe here because buildEmailConfig ensures props match the template
      return await generateEmailPreview({
        to: customerEmail,
        subject: emailConfig.subject,
        template: emailConfig.template,
        props: emailConfig.props as never,
        hasAttachment: emailConfig.hasAttachment,
        attachmentName: emailConfig.attachmentName,
      });
    } catch (error) {
      // Step 7: Handle errors
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : `Failed to preview ${entityName.toLowerCase()} email`,
      };
    }
  };
}
