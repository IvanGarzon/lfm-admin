import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    invoice: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      aggregate: vi.fn(),
    },
    $transaction: vi.fn((input) => {
      if (Array.isArray(input)) return Promise.all(input);
      return input({});
    }),
    $queryRaw: vi.fn(),
  },
}));

vi.mock('@neondatabase/serverless', () => ({
  neonConfig: {},
}));

vi.mock('@prisma/adapter-neon', () => ({
  PrismaNeon: vi.fn(),
}));

// Global mock for environment variables
vi.mock('@/env', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NODE_ENV: 'test',
    // Add other required env vars with dummy values if needed
    NEXTAUTH_SECRET: 'test-secret',
    AUTH_SECRET: 'test-secret',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    AWS_REGION: 'ap-southeast-2',
    AWS_ACCESS_KEY_ID: 'test',
    AWS_SECRET_ACCESS_KEY: 'test',
    AWS_S3_BUCKET_NAME: 'test',
    AWS_ENDPOINT_URL: 'http://localhost:4566',
    RESEND_API_KEY: 're_test',
    CRON_SECRET: 'test',
    INNGEST_APP_ID: 'test',
    OPTIMIZE_API_KEY: 'test',
    AUTH_TRUST_HOST: true,
    USE_ADAPTER: false,
  },
}));

// Also mock relative imports if they bypass the alias
vi.mock('../env', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NODE_ENV: 'test',
  },
}));

// Mock Prisma client enums and classes
vi.mock('@/prisma/client', () => ({
  InvoiceStatus: {
    DRAFT: 'DRAFT',
    PENDING: 'PENDING',
    PAID: 'PAID',
    PARTIALLY_PAID: 'PARTIALLY_PAID',
    OVERDUE: 'OVERDUE',
    CANCELLED: 'CANCELLED',
  },
  UserRole: {
    USER: 'USER',
    MANAGER: 'MANAGER',
    ADMIN: 'ADMIN',
  },
  Prisma: {
    Decimal: class {
      public value: any;
      constructor(v: any) {
        this.value = v;
      }
      toString() {
        return String(this.value);
      }
    },
    sql: vi.fn((strings: TemplateStringsArray, ...values: any[]) => ({
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
  },
  PrismaClient: class {
    public invoice = {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      aggregate: vi.fn(),
    };
    public $transaction = vi.fn((input) => {
      if (Array.isArray(input)) return Promise.all(input);
      return input(this);
    });
    public $queryRaw = vi.fn();
  },
}));

// Mock other problematic modules
vi.mock('@/lib/pdf', () => ({
  generatePdfBuffer: vi.fn().mockResolvedValue(Buffer.from('test')),
}));

vi.mock('@/lib/retry', () => ({
  withDatabaseRetry: (fn: any) => fn(),
}));

afterEach(() => {
  cleanup();
});
