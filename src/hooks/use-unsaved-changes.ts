/**
 * Form Data Loss Prevention Hook
 *
 * Warns users when they try to leave a page with unsaved form changes.
 * Uses the browser's beforeunload event to show a confirmation dialog.
 *
 * Usage:
 * ```typescript
 * import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
 *
 * const form = useForm({...});
 * useUnsavedChanges(form.formState.isDirty);
 * ```
 */

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UseUnsavedChangesOptions {
  /**
   * Whether to show the warning when navigating within the app
   * @default true
   */
  warnOnRouteChange?: boolean;

  /**
   * Custom message to show in the browser's confirmation dialog
   * Note: Most modern browsers ignore custom messages and show a generic one
   * @default 'You have unsaved changes. Are you sure you want to leave?'
   */
  message?: string;
}

/**
 * Hook to warn users about unsaved changes before they leave the page
 * @param isDirty - Whether the form has unsaved changes
 * @param options - Configuration options
 */
export function useUnsavedChanges(isDirty: boolean, options: UseUnsavedChangesOptions = {}) {
  const {
    warnOnRouteChange = true,
    message = 'You have unsaved changes. Are you sure you want to leave?',
  } = options;

  // Handle browser navigation (refresh, close tab, back button to external site)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        // Standard way to trigger the browser's confirmation dialog
        e.preventDefault();
        // Chrome requires returnValue to be set
        e.returnValue = message;
        // Some browsers use the return value
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, message]);

  // Note: Next.js App Router doesn't provide a built-in way to intercept route changes
  // If you need to warn on internal navigation, you'll need to:
  // 1. Use a custom Link component that checks isDirty before navigating
  // 2. Or implement a global navigation guard with a context provider
  // For now, this hook only handles browser-level navigation events
}

/**
 * Hook variant that accepts a callback to determine if there are unsaved changes
 * Useful when you need more complex logic to determine if changes exist
 *
 * @param hasUnsavedChanges - Function that returns whether there are unsaved changes
 * @param options - Configuration options
 */
export function useUnsavedChangesCallback(
  hasUnsavedChanges: () => boolean,
  options: UseUnsavedChangesOptions = {},
) {
  const { message = 'You have unsaved changes. Are you sure you want to leave?' } = options;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, message]);
}

/**
 * Hook to prompt user before navigating away from a form with unsaved changes
 * This version uses a custom confirmation dialog instead of the browser's default
 *
 * @param isDirty - Whether the form has unsaved changes
 * @param onConfirm - Callback when user confirms they want to leave
 * @param onCancel - Callback when user cancels navigation
 */
export function useUnsavedChangesDialog(
  isDirty: boolean,
  onConfirm?: () => void,
  onCancel?: () => void,
) {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';

        // Note: Custom dialogs can't be shown in beforeunload
        // This will show the browser's default dialog
        // For custom dialogs, you need to implement route change interception
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, onConfirm, onCancel]);
}
