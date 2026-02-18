'use client';

import { useEffect, useRef } from 'react';
import type { UseFormReturn, FieldValues, DefaultValues } from 'react-hook-form';

/**
 * Resets form to default values when the entity ID changes.
 * Use this instead of `key={id}` on drawers/modals to avoid full remounts.
 *
 * @param form - The react-hook-form instance
 * @param entityId - The current entity ID (triggers reset when it changes)
 * @param getDefaultValues - Function that returns default values for the current entity
 *
 * @example
 * ```tsx
 * function CustomerForm({ customer }: Props) {
 *   const form = useForm<CustomerFormInput>({
 *     defaultValues: getDefaultValues(customer),
 *   });
 *
 *   // Reset form when switching between customers
 *   useFormReset(form, customer?.id, () => getDefaultValues(customer));
 *
 *   return <form>...</form>;
 * }
 * ```
 */
export function useFormReset<T extends FieldValues>(
  form: UseFormReturn<T>,
  entityId: string | undefined | null,
  getDefaultValues: () => DefaultValues<T>,
) {
  const previousEntityIdRef = useRef<string | undefined | null>(entityId);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip reset on first render - form already has initial values
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousEntityIdRef.current = entityId;
      return;
    }

    // Reset form when entity ID changes (switching between records)
    if (entityId !== previousEntityIdRef.current) {
      previousEntityIdRef.current = entityId;
      form.reset(getDefaultValues());
    }
  }, [entityId, form, getDefaultValues]);
}
