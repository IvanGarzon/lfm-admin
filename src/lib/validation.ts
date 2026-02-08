import { z } from 'zod';

/**
 * Validation constants to prevent abuse and injection attacks
 */
export const VALIDATION_LIMITS = {
  // Text field limits
  NAME_MIN: 2,
  NAME_MAX: 255,
  EMAIL_MAX: 255,
  PHONE_MAX: 50,
  URL_MAX: 2048,
  ABN_MAX: 20,
  ADDRESS_MAX: 500,
  CITY_MAX: 100,
  STATE_MAX: 50,
  POSTCODE_MAX: 20,
  COUNTRY_MAX: 100,

  // Search query limits
  SEARCH_QUERY_MAX: 100,
  SEARCH_QUERY_MIN: 0,

  // Pagination limits
  PAGE_MIN: 1,
  PAGE_MAX: 10000,
  PER_PAGE_MIN: 1,
  PER_PAGE_MAX: 100,
  PER_PAGE_DEFAULT: 20,

  // Financial limits
  GST_MIN: 0,
  GST_MAX: 100,

  // Text content limits
  DESCRIPTION_MAX: 500,
  NOTES_MAX: 1000,
  REASON_MAX: 500,
  TERMS_MAX: 2000,
} as const;

/**
 * Sanitize search query input
 * - Trims whitespace
 * - Removes control characters
 * - Limits length
 */
export function sanitizeSearchQuery(query: string | null | undefined): string {
  if (!query) return '';

  return query
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .slice(0, VALIDATION_LIMITS.SEARCH_QUERY_MAX);
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(
  page: number,
  perPage: number,
): {
  page: number;
  perPage: number;
} {
  const validatedPage = Math.max(
    VALIDATION_LIMITS.PAGE_MIN,
    Math.min(VALIDATION_LIMITS.PAGE_MAX, Math.floor(page)),
  );

  const validatedPerPage = Math.max(
    VALIDATION_LIMITS.PER_PAGE_MIN,
    Math.min(VALIDATION_LIMITS.PER_PAGE_MAX, Math.floor(perPage)),
  );

  return {
    page: validatedPage,
    perPage: validatedPerPage,
  };
}

/**
 * Common Zod validators
 */
export const commonValidators = {
  /**
   * Email validator with max length
   */
  email: () =>
    z
      .string()
      .trim()
      .max(VALIDATION_LIMITS.EMAIL_MAX, 'Email is too long')
      .pipe(z.email({ message: 'Please enter a valid email address' })),

  /**
   * Optional email validator
   */
  emailOptional: () =>
    z
      .string()
      .trim()
      .max(VALIDATION_LIMITS.EMAIL_MAX, 'Email is too long')
      .pipe(z.email({ message: 'Please enter a valid email address' }))
      .or(z.literal(''))
      .optional()
      .nullable(),

  /**
   * Phone number validator with pattern and max length
   */
  phoneOptional: () =>
    z
      .string()
      .trim()
      .max(VALIDATION_LIMITS.PHONE_MAX, 'Phone number is too long')
      .optional()
      .nullable()
      .refine((val) => !val || val.length === 0 || /^[0-9\s\-\+\(\)]+$/.test(val), {
        message: 'Please enter a valid phone number',
      }),

  /**
   * URL validator with max length
   */
  urlOptional: () =>
    z
      .string()
      .trim()
      .max(VALIDATION_LIMITS.URL_MAX, 'URL is too long')
      .pipe(z.url({ message: 'Please enter a valid URL (e.g., https://example.com)' }))
      .or(z.literal(''))
      .optional()
      .nullable(),

  /**
   * Name validator with min and max length
   */
  name: (fieldName = 'Name') =>
    z
      .string()
      .trim()
      .min(VALIDATION_LIMITS.NAME_MIN, `${fieldName} must be at least 2 characters`)
      .max(VALIDATION_LIMITS.NAME_MAX, `${fieldName} is too long`),

  /**
   * Optional string with max length
   */
  stringOptional: (maxLength: number, fieldName = 'Field') =>
    z.string().trim().max(maxLength, `${fieldName} is too long`).optional().nullable(),

  /**
   * Search query validator
   */
  searchQuery: () =>
    z
      .string()
      .trim()
      .max(
        VALIDATION_LIMITS.SEARCH_QUERY_MAX,
        `Search query must be less than ${VALIDATION_LIMITS.SEARCH_QUERY_MAX} characters`,
      )
      .transform(sanitizeSearchQuery),

  /**
   * Page number validator
   */
  page: () =>
    z
      .number()
      .int()
      .min(VALIDATION_LIMITS.PAGE_MIN, 'Page must be at least 1')
      .max(VALIDATION_LIMITS.PAGE_MAX, 'Page number is too large'),

  /**
   * Per page validator
   */
  perPage: () =>
    z
      .number()
      .int()
      .min(VALIDATION_LIMITS.PER_PAGE_MIN, 'Per page must be at least 1')
      .max(
        VALIDATION_LIMITS.PER_PAGE_MAX,
        `Per page must be at most ${VALIDATION_LIMITS.PER_PAGE_MAX}`,
      ),
};
