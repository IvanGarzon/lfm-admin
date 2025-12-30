import { vi } from 'vitest';

export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  PAID: 'PAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
};

export const Prisma = {
  Decimal: class {
    public value: any;
    constructor(v: any) {
      this.value = v;
    }
    toString() {
      return String(this.value);
    }
  },
  PrismaClient: class PrismaClient {
    public invoice = {
      findUnique: () => {},
      findMany: () => {},
      create: () => {},
      update: () => {},
      delete: () => {},
      count: () => {},
    };
    public $transaction = () => {};
  },
  sql: vi.fn((strings: TemplateStringsArray, ...values: any[]) => ({
    strings,
    values,
  })),
};
