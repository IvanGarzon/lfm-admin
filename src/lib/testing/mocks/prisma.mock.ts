/**
 * Prisma Client Mock
 *
 * Provides mock implementations for Prisma client, enums, and classes.
 * Used both as a module alias and in test setup.
 */

import { vi } from 'vitest';

// Prisma Enums
export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  PAID: 'PAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;

export const UserRole = {
  USER: 'USER',
  MANAGER: 'MANAGER',
  ADMIN: 'ADMIN',
} as const;

export const TransactionType = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
} as const;

export const TransactionStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const DocumentKind = {
  INVOICE: 'INVOICE',
  RECEIPT: 'RECEIPT',
  QUOTE: 'QUOTE',
  OTHER: 'OTHER',
} as const;

// Prisma Decimal class mock
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

// Prisma namespace mock
export const Prisma = {
  Decimal: DecimalMock,
  sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
    strings,
    values,
  })),
  QueryMode: {
    insensitive: 'insensitive',
    default: 'default',
  },
  PrismaClientKnownRequestError: class extends Error {
    public code: string = '';
  },
  PrismaClientValidationError: class extends Error {},
  PrismaClientUnknownRequestError: class extends Error {},
  PrismaClientRustPanicError: class extends Error {},
  PrismaClientInitializationError: class extends Error {},
} as const;

// PrismaClient class mock - exported for type imports
// Tests that need prisma create their own local mock
export class PrismaClient {}
