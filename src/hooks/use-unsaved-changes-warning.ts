import { useCallback } from 'react';
import { toast } from 'sonner';

export interface UnsavedChangesWarningConfig {
  /**
   * Form ID to submit when user clicks "Save Now"
   */
  formId: string;

  /**
   * Custom description for the warning toast
   * @default Generic message based on action
   */
  description?: string;

  /**
   * Duration to show the toast in milliseconds
   * @default 5000
   */
  duration?: number;
}

/**
 * Hook to handle unsaved changes warnings with form submission action
 *
 * Returns a wrapper function that:
 * - Checks if there are unsaved changes
 * - Shows a warning toast with "Save Now" action if there are
 * - Executes the callback if there are no unsaved changes
 *
 * @example
 * ```typescript
 * const checkUnsavedChanges = useUnsavedChangesWarning({
 *   formId: 'form-rhf-invoice',
 *   hasUnsavedChanges,
 * });
 *
 * const handleDownload = () => {
 *   checkUnsavedChanges(
 *     () => downloadPdf.mutate(id),
 *     'Please save your changes before downloading the PDF to ensure it reflects the latest data.'
 *   );
 * };
 * ```
 */
export function useUnsavedChangesWarning(
  hasUnsavedChanges: boolean,
  config: UnsavedChangesWarningConfig,
) {
  const { formId, duration = 5000 } = config;

  return useCallback(
    (action: () => void, customDescription?: string) => {
      if (!hasUnsavedChanges) {
        action();
        return;
      }

      toast.warning('You have unsaved changes', {
        description: customDescription ?? config.description ?? 'Please save your changes first.',
        duration,
        action: {
          label: 'Save Now',
          onClick: () => {
            const form = document.getElementById(formId);
            if (form && form instanceof HTMLFormElement) {
              form.requestSubmit();
            }
          },
        },
      });
    },
    [hasUnsavedChanges, formId, config.description, duration],
  );
}
