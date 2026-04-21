/**
 * Integration Test Setup
 *
 * Minimal setup for integration tests — only mocks external services that
 * would cause side effects (email, S3, PDF). The database is real.
 */

import { vi } from 'vitest';

// Mock logger to keep test output clean
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock external services that would cause real side effects
vi.mock('@/lib/s3', () => ({
  uploadFileToS3: vi.fn().mockResolvedValue({
    s3Key: 'test-key',
    s3Url: 'https://test.s3.amazonaws.com/test-key',
  }),
  deleteFileFromS3: vi.fn().mockResolvedValue(true),
  getSignedUrlForDownload: vi.fn().mockResolvedValue('https://signed-url.com/file'),
  getSignedDownloadUrl: vi.fn().mockResolvedValue('https://signed-url.com/file'),
}));

vi.mock('@/lib/pdf', () => ({
  generatePdfBuffer: vi.fn().mockResolvedValue(Buffer.from('test')),
}));

vi.mock('@/services/email-queue.service', () => ({
  queueEmail: vi.fn().mockResolvedValue({}),
  queueInvoiceEmail: vi.fn().mockResolvedValue({}),
  queueQuoteEmail: vi.fn().mockResolvedValue({}),
}));

// next-auth cannot resolve `next/server` in Node/Vitest — mock the auth
// module and its entry point so repositories that transitively import auth
// modules can still load without runtime errors.
vi.mock('next-auth', () => ({
  default: vi.fn(() => ({
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    handlers: { GET: vi.fn(), POST: vi.fn() },
  })),
  getServerSession: vi.fn(),
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  GET: vi.fn(),
  POST: vi.fn(),
}));

// Prevent module-level singleton instantiation in repositories that import
// prisma directly. Integration tests pass getTestPrisma() via the constructor.
vi.mock('@/lib/prisma', () => ({
  prisma: {},
}));

vi.mock('@/env', () => ({
  env: {
    NODE_ENV: 'test',
    NEXTAUTH_SECRET: 'test-secret',
    AUTH_SECRET: 'test-secret',
    AWS_REGION: 'ap-southeast-2',
    AWS_ACCESS_KEY_ID: 'test',
    AWS_SECRET_ACCESS_KEY: 'test',
    AWS_S3_BUCKET_NAME: 'test',
    AWS_ENDPOINT_URL: 'http://localhost:4566',
    RESEND_API_KEY: 're_test',
    CRON_SECRET: 'test',
    INNGEST_APP_ID: 'test',
    AUTH_TRUST_HOST: true,
  },
}));
