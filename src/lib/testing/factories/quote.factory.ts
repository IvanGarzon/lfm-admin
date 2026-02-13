/**
 * Quote Factory
 *
 * Creates mock quote objects and related data for testing.
 * Uses existing types from schemas and features.
 */

import { testIds } from '../id-generator';
import type { QuoteStatus } from '@/prisma/client';
import type { CreateQuoteInput } from '@/schemas/quotes';
import type { QuoteItemAttachment } from '@/features/finances/quotes/types';

// Derive item type from schema
type QuoteItemInput = CreateQuoteInput['items'][number];

// Response type for repository returns (minimal)
interface QuoteResponse {
  id: string;
  quoteNumber: string;
  status?: QuoteStatus;
  versionNumber?: number;
}

/**
 * Creates valid quote input data for create/update mutations.
 */
export function createQuoteInput(overrides: Partial<CreateQuoteInput> = {}): CreateQuoteInput {
  return {
    customerId: overrides.customerId ?? testIds.customer(),
    status: 'DRAFT',
    issuedDate: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    currency: 'AUD',
    gst: 10,
    discount: 0,
    items: [createQuoteItemInput()],
    ...overrides,
  };
}

/**
 * Creates a quote item input.
 */
export function createQuoteItemInput(overrides: Partial<QuoteItemInput> = {}): QuoteItemInput {
  return {
    description: 'Test Item',
    quantity: 1,
    unitPrice: 100,
    productId: null,
    colors: [],
    ...overrides,
  };
}

/**
 * Creates a mock quote response as returned by the repository.
 */
export function createQuoteResponse(overrides: Partial<QuoteResponse> = {}): QuoteResponse {
  return {
    id: overrides.id ?? testIds.quote(),
    quoteNumber: overrides.quoteNumber ?? 'QUO-2024-0001',
    ...overrides,
  };
}

/**
 * Creates a mock quote version response.
 */
export function createQuoteVersionResponse(overrides: Partial<QuoteResponse> = {}): QuoteResponse {
  return {
    id: overrides.id ?? testIds.quoteVersion(),
    quoteNumber: overrides.quoteNumber ?? 'QUO-2024-0001-v2',
    versionNumber: overrides.versionNumber ?? 2,
    ...overrides,
  };
}

/**
 * Creates a mock quote item attachment.
 */
export function createQuoteItemAttachment(
  overrides: Partial<QuoteItemAttachment> = {},
): QuoteItemAttachment {
  const id = overrides.id ?? testIds.attachment();
  return {
    id,
    quoteItemId: overrides.quoteItemId ?? testIds.quoteItem(),
    fileName: 'image.jpg',
    fileSize: 2048,
    mimeType: 'image/jpeg',
    s3Key: `quotes/items/${id}/image.jpg`,
    s3Url: `https://test.s3.amazonaws.com/quotes/items/${id}/image.jpg`,
    uploadedBy: overrides.uploadedBy ?? testIds.user(),
    uploadedAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates mock quote statistics.
 */
export function createQuoteStatistics(overrides: Partial<Record<string, number>> = {}) {
  return {
    total: 100,
    draft: 20,
    sent: 30,
    accepted: 25,
    rejected: 10,
    expired: 15,
    ...overrides,
  };
}

/**
 * Pre-built quote factories for common test scenarios.
 */
export const mockQuotes = {
  /**
   * Creates a draft quote input.
   */
  draftInput: (customerId?: string) => createQuoteInput({ customerId, status: 'DRAFT' }),

  /**
   * Creates a sent quote input.
   */
  sentInput: (customerId?: string) => createQuoteInput({ customerId, status: 'SENT' }),

  /**
   * Creates a quote response.
   */
  response: (id?: string, quoteNumber?: string) => createQuoteResponse({ id, quoteNumber }),

  /**
   * Creates a version response.
   */
  versionResponse: (id?: string, versionNumber?: number) =>
    createQuoteVersionResponse({ id, versionNumber }),
} as const;
