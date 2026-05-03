/**
 * Prisma Client Mock
 *
 * Re-exports all generated enums (zero runtime dependencies) and provides
 * minimal stubs for the Prisma namespace and PrismaClient class.
 *
 * Used as a module alias in vitest.config.ts to replace @/prisma/client
 * without loading the Prisma runtime.
 */

import { vi } from 'vitest';

// All generated enums — no import changes needed when schema evolves.
export * from '../../../../prisma/generated/client/enums';

// Prisma Decimal class stub
class DecimalMock {
  public value: unknown;
  constructor(v: unknown) {
    this.value = v;
  }
  toString() {
    return String(this.value);
  }
  toNumber() {
    return Number(this.value);
  }
}

// Prisma namespace stub
export const Prisma = {
  Decimal: DecimalMock,
  sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values })),
  QueryMode: {
    insensitive: 'insensitive',
    default: 'default'
  },
  PrismaClientKnownRequestError: class extends Error {
    public code: string = '';
  },
  PrismaClientValidationError: class extends Error {},
  PrismaClientUnknownRequestError: class extends Error {},
  PrismaClientRustPanicError: class extends Error {},
  PrismaClientInitializationError: class extends Error {}
} as const;

// PrismaClient stub — never instantiated in unit tests
export class PrismaClient {}
