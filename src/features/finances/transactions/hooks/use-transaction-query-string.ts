'use client';

import { useQueryStates } from 'nuqs';

type NuqsParser<T> = {
  parse: (value: string) => T | null;
  serialize: (value: T) => string;
  [key: string]: unknown;
};

export function useTransactionQueryString<T extends Record<string, unknown>>(
  searchParams: { [K in keyof T]: NuqsParser<T[K]> },
  defaults: Partial<T>,
): string {
  const [currentParams] = useQueryStates(searchParams);
  const queryParts: string[] = [];

  for (const key of Object.keys(searchParams) as (keyof T)[]) {
    if (!Object.prototype.hasOwnProperty.call(searchParams, key)) {
      continue;
    }

    const value = currentParams[key];
    const defaultValue = defaults[key];
    const parser = searchParams[key];

    if (value === null || value === undefined) {
      continue;
    }

    if (isDefaultValue(value, defaultValue)) {
      continue;
    }

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
    return value.length === 0 && defaultValue.length === 0;
  }
  return value === defaultValue;
}
