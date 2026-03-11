'use client';

import { useEffect, useRef } from 'react';
import type { UseFormReturn, FieldValues, DefaultValues } from 'react-hook-form';

/**
 * Resets form to default values when the entity ID changes or when a reset trigger updates.
 * Use this instead of `key={id}` on drawers/modals to avoid full remounts.
 *
 * @param form - The react-hook-form instance
 * @param entityId - The current entity ID (triggers reset when it changes)
 * @param getDefaultValues - Function that returns default values for the current entity
 * @param resetTrigger - Optional value that triggers a reset when it changes (e.g., updatedAt timestamp, or isUpdating boolean)
 *
 * @example
 * ```tsx
 * function CustomerForm({ customer, isUpdating }: Props) {
 *   const form = useForm<CustomerFormInput>({
 *     defaultValues: getDefaultValues(customer),
 *   });
 *
 *   // Reset form when switching customers OR when update completes
 *   useFormReset(form, customer?.id, () => getDefaultValues(customer), isUpdating);
 *
 *   return <form>...</form>;
 * }
 * ```
 */
export function useFormReset<T extends FieldValues>(
  form: UseFormReturn<T>,
  entityId: string | undefined | null,
  getDefaultValues: () => DefaultValues<T>,
  resetTrigger?: unknown,
) {
  const previousEntityIdRef = useRef<string | undefined | null>(entityId);
  const previousResetTriggerRef = useRef<unknown>(resetTrigger);
  const wasUpdatingRef = useRef(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip reset on first render - form already has initial values
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousEntityIdRef.current = entityId;
      previousResetTriggerRef.current = resetTrigger;
      wasUpdatingRef.current = resetTrigger === true;
      return;
    }

    // Reset form when entity ID changes (switching between records)
    if (entityId !== previousEntityIdRef.current) {
      previousEntityIdRef.current = entityId;
      previousResetTriggerRef.current = resetTrigger;
      wasUpdatingRef.current = resetTrigger === true;
      form.reset(getDefaultValues());
      return;
    }

    // Reset form when update completes (isUpdating goes from true -> false)
    // This syncs the form with fresh data from the server after a successful mutation
    if (typeof resetTrigger === 'boolean' && wasUpdatingRef.current && !resetTrigger) {
      previousResetTriggerRef.current = resetTrigger;
      wasUpdatingRef.current = false;
      form.reset(getDefaultValues());
      return;
    }

    // Track current state for next comparison
    if (resetTrigger !== previousResetTriggerRef.current) {
      previousResetTriggerRef.current = resetTrigger;
      wasUpdatingRef.current = resetTrigger === true;
    }
  }, [entityId, resetTrigger, form, getDefaultValues]);
}
