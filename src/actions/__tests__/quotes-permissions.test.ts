/**
 * Permission Tests for Quote Actions
 *
 * Tests that quote actions properly enforce role-based permissions:
 * - USER role: can read quotes only
 * - MANAGER role: can read and manage quotes
 * - ADMIN role: full access
 *
 * Run with: npm test quotes-permissions
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import type { Session } from 'next-auth';
import * as quoteActions from '../quotes';
import { auth } from '@/auth';

// Type for the mocked auth function
type AuthFunction = () => Promise<Session | null>;
const mockAuth = auth as unknown as MockedFunction<AuthFunction>;

// Mock Next.js functions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock the auth module
vi.mock('@/auth', () => ({
  auth: vi.fn<() => Promise<Session | null>>(),
}));

// Mock the repositories to avoid actual database calls
vi.mock('@/repositories/quote-repository', () => ({
  QuoteRepository: class MockQuoteRepository {
    searchAndPaginate = vi.fn().mockResolvedValue({ items: [], pagination: {} });
    findById = vi.fn().mockResolvedValue({ id: '1', status: 'DRAFT' });
    findByIdWithDetails = vi.fn().mockResolvedValue({ id: '1', status: 'DRAFT' });
    createQuoteWithItems = vi.fn().mockResolvedValue({ id: '1', quoteNumber: 'QUO-2024-0001' });
    softDelete = vi.fn().mockResolvedValue(true);
    updateQuote = vi.fn().mockResolvedValue({ id: '1' });
    updateQuoteWithItems = vi.fn().mockResolvedValue({ id: '1' });
    updateStatus = vi.fn().mockResolvedValue({ id: '1', status: 'ACCEPTED' });
    markAsAccepted = vi.fn().mockResolvedValue({ id: '1', status: 'ACCEPTED' });
    markAsRejected = vi.fn().mockResolvedValue({ id: '1', status: 'REJECTED' });
    markAsSent = vi.fn().mockResolvedValue({ id: '1', status: 'SENT' });
    markAsOnHold = vi.fn().mockResolvedValue({ id: '1', status: 'ON_HOLD' });
    markAsCancelled = vi.fn().mockResolvedValue({ id: '1', status: 'CANCELLED' });
    convertToInvoice = vi.fn().mockResolvedValue({ id: '1', status: 'ACCEPTED' });
  },
}));

vi.mock('@/repositories/invoice-repository', () => ({
  InvoiceRepository: class MockInvoiceRepository {
    createInvoiceFromQuote = vi.fn().mockResolvedValue({ id: '1', invoiceNumber: 'INV-2024-0001' });
    generateInvoiceNumber = vi.fn().mockResolvedValue('INV-2024-0001');
  },
}));

// Mock S3 functions
vi.mock('@/lib/s3', () => ({
  uploadFileToS3: vi.fn().mockResolvedValue({ key: 'test-key', url: 'test-url' }),
  deleteFileFromS3: vi.fn().mockResolvedValue(true),
  getSignedUrlForDownload: vi.fn().mockResolvedValue('signed-url'),
}));

// Mock users with different roles
const mockUserRole: Session = {
  id: 'session-user',
  user: {
    id: 'test-user-id',
    email: 'test-user@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER' as const,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

const mockManagerRole: Session = {
  id: 'session-manager',
  user: {
    id: 'test-manager-id',
    email: 'test-manager@example.com',
    firstName: 'Test',
    lastName: 'Manager',
    role: 'MANAGER' as const,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

const mockAdminRole: Session = {
  id: 'session-admin',
  user: {
    id: 'test-admin-id',
    email: 'test-admin@example.com',
    firstName: 'Test',
    lastName: 'Admin',
    role: 'ADMIN' as const,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

describe('Quote Actions - Permission Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // QUERY TESTS (Read Operations)
  // ============================================================================

  describe('Query Actions (canReadQuotes)', () => {
    describe('getQuotes', () => {
      it('should allow USER role to read quotes', async () => {
        mockAuth.mockResolvedValue(mockUserRole);

        const result = await quoteActions.getQuotes({});

        expect(result.success).toBe(true);
      });

      it('should allow MANAGER role to read quotes', async () => {
        mockAuth.mockResolvedValue(mockManagerRole);

        const result = await quoteActions.getQuotes({});

        expect(result.success).toBe(true);
      });

      it('should allow ADMIN role to read quotes', async () => {
        mockAuth.mockResolvedValue(mockAdminRole);

        const result = await quoteActions.getQuotes({});

        expect(result.success).toBe(true);
      });

      it('should deny unauthenticated users', async () => {
        mockAuth.mockResolvedValue(null);

        const result = await quoteActions.getQuotes({});

        expect(result.success).toBe(false);
        expect(result.error).toBe('Unauthorized');
      });
    });

    describe('getQuoteById', () => {
      it('should allow USER role to read quote details', async () => {
        mockAuth.mockResolvedValue(mockUserRole);

        const result = await quoteActions.getQuoteById('test-id');

        expect(result.success).toBe(true);
      });
    });
  });

  // ============================================================================
  // MUTATION TESTS (Write Operations - canManageQuotes required)
  // ============================================================================

  describe('Mutation Actions (canManageQuotes)', () => {
    describe('createQuote', () => {
      const validQuoteData = {
        customerId: 'customer-1',
        issuedDate: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'DRAFT' as const,
        currency: 'AUD',
        gst: 10,
        discount: 0,
        items: [
          {
            description: 'Test Item',
            quantity: 1,
            unitPrice: 100,
            productId: null,
            colors: [],
          },
        ],
      };

      it('should DENY USER role from creating quotes', async () => {
        mockAuth.mockResolvedValue(mockUserRole);

        const result = await quoteActions.createQuote(validQuoteData);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Unauthorized');
      });

      it('should ALLOW MANAGER role to create quotes', async () => {
        mockAuth.mockResolvedValue(mockManagerRole);

        const result = await quoteActions.createQuote(validQuoteData);

        expect(result.success).toBe(true);
      });

      it('should ALLOW ADMIN role to create quotes', async () => {
        mockAuth.mockResolvedValue(mockAdminRole);

        const result = await quoteActions.createQuote(validQuoteData);

        expect(result.success).toBe(true);
      });
    });

    describe('updateQuote', () => {
      const updateData = {
        id: 'quote-1',
        customerId: 'customer-1',
        status: 'DRAFT' as const,
        issuedDate: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        currency: 'AUD',
        gst: 10,
        discount: 0,
        items: [
          {
            description: 'Updated Item',
            quantity: 2,
            unitPrice: 150,
            productId: null,
            colors: [],
          },
        ],
      };

      it('should DENY USER role from updating quotes', async () => {
        mockAuth.mockResolvedValue(mockUserRole);

        const result = await quoteActions.updateQuote(updateData);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Unauthorized');
      });

      it('should ALLOW MANAGER role to update quotes', async () => {
        mockAuth.mockResolvedValue(mockManagerRole);

        const result = await quoteActions.updateQuote(updateData);

        expect(result.success).toBe(true);
      });
    });

    describe('deleteQuote', () => {
      it('should DENY USER role from deleting quotes', async () => {
        mockAuth.mockResolvedValue(mockUserRole);

        const result = await quoteActions.deleteQuote('quote-1');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Unauthorized');
      });

      it('should ALLOW MANAGER role to delete quotes', async () => {
        mockAuth.mockResolvedValue(mockManagerRole);

        const result = await quoteActions.deleteQuote('quote-1');

        expect(result.success).toBe(true);
      });

      it('should ALLOW ADMIN role to delete quotes', async () => {
        mockAuth.mockResolvedValue(mockAdminRole);

        const result = await quoteActions.deleteQuote('quote-1');

        expect(result.success).toBe(true);
      });
    });

    describe('markQuoteAsAccepted', () => {
      it('should DENY USER role from marking quotes as accepted', async () => {
        mockAuth.mockResolvedValue(mockUserRole);

        const result = await quoteActions.markQuoteAsAccepted({ id: 'quote-1' });

        expect(result.success).toBe(false);
        expect(result.error).toContain('Unauthorized');
      });

      it('should ALLOW MANAGER role to mark quotes as accepted', async () => {
        mockAuth.mockResolvedValue(mockManagerRole);

        const result = await quoteActions.markQuoteAsAccepted({ id: 'quote-1' });

        expect(result.success).toBe(true);
      });
    });

    describe('convertQuoteToInvoice', () => {
      const conversionData = {
        id: 'quote-1',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        gst: 10,
        discount: 0,
      };

      it('should DENY USER role from converting quotes', async () => {
        mockAuth.mockResolvedValue(mockUserRole);

        const result = await quoteActions.convertQuoteToInvoice(conversionData);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Unauthorized');
      });

      it('should ALLOW MANAGER role to convert quotes', async () => {
        mockAuth.mockResolvedValue(mockManagerRole);

        const result = await quoteActions.convertQuoteToInvoice(conversionData);

        expect(result.success).toBe(true);
      });
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle missing user session', async () => {
      mockAuth.mockResolvedValue({ user: null } as any);

      const result = await quoteActions.getQuotes({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('should handle invalid role', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'test',
          email: 'test@example.com',
          role: 'INVALID_ROLE' as any,
        },
      } as any);

      const result = await quoteActions.createQuote({
        customerId: 'customer-1',
        issuedDate: new Date(),
        validUntil: new Date(),
        items: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
    });
  });
});
