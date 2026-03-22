import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { EmailPreviewData } from '@/components/email/email-preview-dialog';
import type { EmailPreviewResult } from '@/lib/email-preview';

export interface EmailPreviewAction<TEmailType extends string> {
  entityId: string;
  emailType: TEmailType;
}

export interface UseEntityEmailPreviewConfig<TEmailType extends string> {
  /**
   * Function to generate email preview for an entity
   */
  previewFn: (entityId: string, emailType: TEmailType) => Promise<EmailPreviewResult>;

  /**
   * Function to send email after preview confirmation
   * Returns the mutation function that should be called with the entity ID
   */
  sendEmailFn: (
    emailType: TEmailType,
  ) => (entityId: string, options?: { onSuccess?: () => void }) => void;

  /**
   * Optional callback when email send succeeds
   */
  onSuccess?: () => void;
}

export interface UseEntityEmailPreviewReturn<TEmailType extends string> {
  // State
  showEmailPreview: boolean;
  emailPreviewData: EmailPreviewData | null;
  isLoadingEmailPreview: boolean;
  pendingEmailAction: EmailPreviewAction<TEmailType> | null;

  // Handlers
  handleLoadEmailPreview: (entityId: string, emailType: TEmailType) => Promise<void>;
  handleConfirmSendEmail: () => void;
  handleCancelEmailPreview: () => void;

  // State setters (for dialog control)
  setShowEmailPreview: (show: boolean) => void;
}

/**
 * Generic hook for managing email preview state and handlers
 *
 * Handles:
 * - Email preview state management
 * - Loading email preview with error handling
 * - Confirming and sending email
 * - Cancelling email preview
 *
 * @example
 * ```typescript
 * const emailPreview = useEntityEmailPreview({
 *   previewFn: previewInvoiceEmail,
 *   sendEmailFn: (emailType) => {
 *     if (emailType === 'reminder') return sendReminder.mutate;
 *     return sendEmail.mutate;
 *   },
 * });
 *
 * // In your component
 * <button onClick={() => emailPreview.handleLoadEmailPreview(id, 'reminder')}>
 *   Send Reminder
 * </button>
 *
 * <EmailPreviewDialog
 *   open={emailPreview.showEmailPreview}
 *   emailData={emailPreview.emailPreviewData}
 *   onConfirm={emailPreview.handleConfirmSendEmail}
 *   onCancel={emailPreview.handleCancelEmailPreview}
 * />
 * ```
 */
export function useEntityEmailPreview<TEmailType extends string>(
  config: UseEntityEmailPreviewConfig<TEmailType>,
): UseEntityEmailPreviewReturn<TEmailType> {
  const { previewFn, sendEmailFn, onSuccess } = config;

  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailPreviewData, setEmailPreviewData] = useState<EmailPreviewData | null>(null);
  const [isLoadingEmailPreview, setIsLoadingEmailPreview] = useState(false);
  const [pendingEmailAction, setPendingEmailAction] =
    useState<EmailPreviewAction<TEmailType> | null>(null);

  const handleLoadEmailPreview = useCallback(
    async (entityId: string, emailType: TEmailType) => {
      setIsLoadingEmailPreview(true);
      setShowEmailPreview(true);
      setPendingEmailAction({ entityId, emailType });

      try {
        const result = await previewFn(entityId, emailType);

        if (!result.success) {
          toast.error('Failed to load email preview', {
            description: result.error,
          });
          setShowEmailPreview(false);
          setPendingEmailAction(null);
          return;
        }

        setEmailPreviewData(result.data);
      } catch (error) {
        toast.error('Failed to load email preview', {
          description: error instanceof Error ? error.message : 'An error occurred',
        });
        setShowEmailPreview(false);
        setPendingEmailAction(null);
      } finally {
        setIsLoadingEmailPreview(false);
      }
    },
    [previewFn],
  );

  const handleConfirmSendEmail = useCallback(() => {
    if (!pendingEmailAction) {
      return;
    }

    const onSuccessCallback = () => {
      setShowEmailPreview(false);
      setEmailPreviewData(null);
      setPendingEmailAction(null);
      onSuccess?.();
    };

    const sendMutation = sendEmailFn(pendingEmailAction.emailType);
    sendMutation(pendingEmailAction.entityId, { onSuccess: onSuccessCallback });
  }, [pendingEmailAction, sendEmailFn, onSuccess]);

  const handleCancelEmailPreview = useCallback(() => {
    setShowEmailPreview(false);
    setEmailPreviewData(null);
    setPendingEmailAction(null);
  }, []);

  return {
    // State
    showEmailPreview,
    emailPreviewData,
    isLoadingEmailPreview,
    pendingEmailAction,

    // Handlers
    handleLoadEmailPreview,
    handleConfirmSendEmail,
    handleCancelEmailPreview,

    // State setters
    setShowEmailPreview,
  };
}
