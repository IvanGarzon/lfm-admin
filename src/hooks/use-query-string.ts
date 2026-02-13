'use client';

import { useQueryStates, type GenericParserBuilder } from 'nuqs';

/**
 * Shared hook to serialize current query parameters to a query string.
 * Used to preserve filters when navigating to/from detail views.
 *
 * @param searchParams - The search params configuration from nuqs
 * @param defaults - Default values to exclude from the query string
 * @returns A query string (without leading '?')
 */
export function useQueryString<T extends Record<string, unknown>>(
  searchParams: { [K in keyof T]: GenericParserBuilder<T[K]> },
  defaults: Partial<T>,
): string {
  const [currentParams] = useQueryStates(searchParams);
  const queryParts: string[] = [];

  for (const key of Object.keys(searchParams) as (keyof T)[]) {
    const value = currentParams[key];
    const defaultValue = defaults[key];
    const parser = searchParams[key];

    if (value === null || value === undefined) continue;
    if (isDefaultValue(value, defaultValue)) continue;

    const serialized = parser.serialize(value);
    if (serialized) {
      queryParts.push(`${String(key)}=${serialized}`);
    }
  }

  return queryParts.join('&');
}

function isDefaultValue(value: unknown, defaultValue: unknown): boolean {
  if (value === '' && defaultValue === '') return true;
  if (Array.isArray(value) && Array.isArray(defaultValue)) {
    if (value.length === 0 && defaultValue.length === 0) return true;
    return JSON.stringify(value) === JSON.stringify(defaultValue);
  }
  return value === defaultValue;
}
