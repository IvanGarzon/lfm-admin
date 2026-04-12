import { faker } from '@faker-js/faker';
import { States } from '@/prisma/client';

// -- Constants ---------------------------------------------------------------

export const AU_STATES = Object.values(States);

// -- Australian data helpers -------------------------------------------------

/** Generates a realistic Australian ABN (11 digits, space-formatted). */
export function fakeAbn(): string {
  return `${faker.string.numeric(2)} ${faker.string.numeric(3)} ${faker.string.numeric(3)} ${faker.string.numeric(3)}`;
}

/** Generates an Australian BSB number. */
export function fakeBsb(): string {
  return `${faker.string.numeric(3)}-${faker.string.numeric(3)}`;
}

/**
 * Generates an Australian mobile number (04XX XXX XXX).
 * Use when only a mobile is appropriate (e.g. employees, tenant contacts).
 */
export function fakeAuMobile(): string {
  return `04${faker.string.numeric(8)}`;
}

/**
 * Generates an Australian phone number — either a mobile (04XX) or a
 * landline (02/03/07/08). Use where both are valid (e.g. businesses, vendors).
 */
export function fakeAuPhone(): string {
  return faker.helpers.weightedArrayElement([
    { value: () => `04${faker.string.numeric(8)}`, weight: 0.7 },
    {
      value: () => `0${faker.helpers.arrayElement(['2', '3', '7', '8'])}${faker.string.numeric(8)}`,
      weight: 0.3,
    },
  ])();
}

// -- String helpers ----------------------------------------------------------

/** Capitalises the first letter of a string. */
export function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Derives a URL-safe, lowercase slug from a string with a short unique suffix. */
export function toSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return `${base}-${faker.string.alphanumeric(4).toLowerCase()}`;
}

// -- CLI helpers -------------------------------------------------------------

/**
 * Parses a named flag from argv.
 * Supports: --flag=value  or  --flag value
 */
export function parseArg(flag: string): string | undefined {
  const args = process.argv.slice(2);
  const eqForm = args.find((a) => a.startsWith(`--${flag}=`));
  if (eqForm) return eqForm.split('=')[1];
  const idx = args.indexOf(`--${flag}`);
  if (idx !== -1) return args[idx + 1];
  return undefined;
}

/** Returns true if a boolean flag (e.g. --fresh, --yes) is present in argv. */
export function hasFlag(flag: string): boolean {
  return process.argv.slice(2).some((a) => a === `--${flag}`);
}

// -- Concurrency helpers -----------------------------------------------------

/**
 * Runs an array of async factory functions in parallel batches.
 * Uses allSettled so individual failures don't abort the batch.
 * @param fns - Lazy factory functions to invoke.
 * @param batchSize - Maximum concurrent executions per batch (default 20).
 * @returns Fulfilled results and a count of failures.
 */
export async function batchAll<T>(
  fns: Array<() => Promise<T>>,
  batchSize = 20,
): Promise<{ results: T[]; failed: number }> {
  const results: T[] = [];
  let failed = 0;

  for (let i = 0; i < fns.length; i += batchSize) {
    const settled = await Promise.allSettled(fns.slice(i, i + batchSize).map((fn) => fn()));
    for (const r of settled) {
      if (r.status === 'fulfilled') results.push(r.value);
      else failed++;
    }
  }

  return { results, failed };
}
