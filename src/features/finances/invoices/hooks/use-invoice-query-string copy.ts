'use client';

import { useQueryStates } from 'nuqs';

/**
 * Generic hook to serialize query parameters for any filter configuration
 */
export function useInvoiceQueryString<T extends Record<string, any>>(
  searchParams: T,
  defaults: Record<string, unknown>,
): string {
  const [currentParams] = useQueryStates(searchParams);

  const queryParts: string[] = [];

  for (const key in searchParams) {
    if (!Object.prototype.hasOwnProperty.call(searchParams, key)) continue;

    const value = currentParams[key];
    const defaultValue = defaults[key];
    const parser = searchParams[key];

    // Skip null/undefined
    if (value === null || value === undefined) continue;

    // Skip defaults
    if (value === defaultValue) continue;

    // Serialize - the parser knows how to handle its own value type
    if ('serialize' in parser && typeof parser.serialize === 'function') {
      const serialized = parser.serialize(value, defaultValue);
      if (serialized) {
        queryParts.push(`${key}=${serialized}`);
      }
    }
  }

  return queryParts.join('&');
}
