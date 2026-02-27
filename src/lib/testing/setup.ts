/**
 * Vitest Global Test Setup
 *
 * This file runs automatically before all tests.
 * It sets up global mocks and test utilities.
 */

import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Mock Prisma client - prevents actual DB connection
// Tests mock repositories, not prisma directly
vi.mock('@/lib/prisma', () => ({
  prisma: {},
}));

// Mock Neon adapter
vi.mock('@neondatabase/serverless', () => ({
  neonConfig: {},
}));

vi.mock('@prisma/adapter-neon', () => ({
  PrismaNeon: vi.fn(),
}));

// Mock environment variables
vi.mock('@/env', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NODE_ENV: 'test',
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
    AUTH_TRUST_HOST: true,
  },
}));

// Also mock relative imports if they bypass the alias
vi.mock('../env', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NODE_ENV: 'test',
  },
}));

// Note: @/prisma/client is handled by vitest.config.ts alias → prisma.mock.ts

// Mock PDF generation
vi.mock('@/lib/pdf', () => ({
  generatePdfBuffer: vi.fn().mockResolvedValue(Buffer.from('test')),
}));

// Mock database retry utility
vi.mock('@/lib/retry', () => ({
  withDatabaseRetry: (fn: () => unknown) => fn(),
}));

// Mock logger - used across all tests
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock S3 utilities with sensible defaults
vi.mock('@/lib/s3', () => ({
  uploadFileToS3: vi.fn().mockResolvedValue({
    s3Key: 'test-key',
    s3Url: 'https://test.s3.amazonaws.com/test-key',
  }),
  deleteFileFromS3: vi.fn().mockResolvedValue(true),
  getSignedUrlForDownload: vi.fn().mockResolvedValue('https://signed-url.com/file'),
  getSignedDownloadUrl: vi.fn().mockResolvedValue('https://signed-url.com/file'),
  ALLOWED_IMAGE_MIME_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
}));

// Mock email queue service - used by invoice/quote mutations
vi.mock('@/services/email-queue.service', () => ({
  queueEmail: vi.fn().mockResolvedValue({}),
  queueInvoiceEmail: vi.fn().mockResolvedValue({}),
  queueQuoteEmail: vi.fn().mockResolvedValue({}),
}));

// Cleanup after each test
afterEach(() => {
  cleanup();
});
