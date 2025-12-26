import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getQuotes,
  getQuoteById,
  getQuoteStatistics,
  getQuoteAttachments,
  getAttachmentDownloadUrl,
  getQuoteItemAttachments,
  getItemAttachmentDownloadUrl,
  getQuoteVersions,
} from '../queries';
import { auth } from '@/auth';
import { requirePermission } from '@/lib/permissions';
import { QuoteRepository } from '@/repositories/quote-repository';
import { QuoteStatus } from '@/prisma/client';

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

const { mockRepoInstance } = vi.hoisted(() => ({
  mockRepoInstance: {
    searchAndPaginate: vi.fn(),
    findByIdWithDetails: vi.fn(),
    getStatistics: vi.fn(),
    getQuoteAttachments: vi.fn(),
    getAttachmentById: vi.fn(),
    getQuoteItemAttachments: vi.fn(),
    getItemAttachmentById: vi.fn(),
    getQuoteVersions: vi.fn(),
  },
}));

// Mock QuoteRepository
vi.mock('@/repositories/quote-repository', () => {
  return {
    QuoteRepository: vi.fn().mockImplementation(function () {
      return mockRepoInstance;
    }),
  };
});

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/permissions', () => ({
  requirePermission: vi.fn(),
}));

vi.mock('@/lib/s3', () => ({
  getSignedDownloadUrl: vi.fn().mockResolvedValue('https://signed-url.com/file.pdf'),
}));

describe('Quote Queries', () => {
  const mockSession = {
    user: { id: 'user_123', email: 'test@example.com', role: 'MANAGER' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue(mockSession);
  });

  describe('getQuotes', () => {
    it('returns paginated quotes successfully when authorized', async () => {
      const mockResult = {
        items: [
          { id: '1', quoteNumber: 'QUO-001', status: 'DRAFT' },
          { id: '2', quoteNumber: 'QUO-002', status: 'SENT' },
        ],
        pagination: { page: 1, perPage: 10, total: 2 },
      };

      mockRepoInstance.searchAndPaginate.mockResolvedValue(mockResult);

      const result = await getQuotes({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockResult);
      }
      expect(requirePermission).toHaveBeenCalledWith(mockSession.user, 'canReadQuotes');
      expect(mockRepoInstance.searchAndPaginate).toHaveBeenCalled();
    });

    it('returns unauthorized when no session', async () => {
      (auth as any).mockResolvedValue(null);
      const result = await getQuotes({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unauthorized');
      }
    });

    it('handles invalid query parameters', async () => {
      const result = await getQuotes({ page: 'invalid' } as any);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid query parameters');
      }
    });

    it('applies filters correctly', async () => {
      const mockResult = {
        items: [{ id: '1', quoteNumber: 'QUO-001', status: 'DRAFT' }],
        pagination: { page: 1, perPage: 10, total: 1 },
      };

      mockRepoInstance.searchAndPaginate.mockResolvedValue(mockResult);

      await getQuotes({ status: 'DRAFT', search: 'test' });

      expect(mockRepoInstance.searchAndPaginate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'test',
        })
      );
    });
  });

  describe('getQuoteById', () => {
    it('returns quote details successfully when authorized', async () => {
      const mockQuote = {
        id: '1',
        quoteNumber: 'QUO-001',
        status: 'DRAFT',
        customer: { id: 'cust-1', firstName: 'John', lastName: 'Doe' },
        items: [{ id: 'item-1', description: 'Test Item', quantity: 1, unitPrice: 100 }],
      };

      mockRepoInstance.findByIdWithDetails.mockResolvedValue(mockQuote);

      const result = await getQuoteById('1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockQuote);
      }
      expect(requirePermission).toHaveBeenCalledWith(mockSession.user, 'canReadQuotes');
    });

    it('returns error when quote not found', async () => {
      mockRepoInstance.findByIdWithDetails.mockResolvedValue(null);

      const result = await getQuoteById('non-existent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Quote not found');
      }
    });

    it('returns unauthorized when no session', async () => {
      (auth as any).mockResolvedValue(null);
      const result = await getQuoteById('1');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unauthorized');
      }
    });
  });

  describe('getQuoteStatistics', () => {
    it('returns statistics successfully when authorized', async () => {
      const mockStats = {
        total: 100,
        draft: 20,
        sent: 30,
        accepted: 25,
        rejected: 10,
        expired: 15,
      };

      mockRepoInstance.getStatistics.mockResolvedValue(mockStats);

      const result = await getQuoteStatistics();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockStats);
      }
      expect(requirePermission).toHaveBeenCalledWith(mockSession.user, 'canReadQuotes');
    });

    it('returns statistics with date filter', async () => {
      const mockStats = { total: 50, draft: 10, sent: 15 };
      mockRepoInstance.getStatistics.mockResolvedValue(mockStats);

      const dateFilter = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = await getQuoteStatistics(dateFilter);

      expect(result.success).toBe(true);
      expect(mockRepoInstance.getStatistics).toHaveBeenCalledWith(dateFilter);
    });

    it('returns unauthorized when no session', async () => {
      (auth as any).mockResolvedValue(null);
      const result = await getQuoteStatistics();
      expect(result.success).toBe(false);
    });
  });

  describe('getQuoteAttachments', () => {
    it('returns quote attachments successfully', async () => {
      const mockAttachments = [
        {
          id: 'att-1',
          quoteId: 'quote-1',
          fileName: 'document.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          s3Key: 'key-1',
          s3Url: 'url-1',
          uploadedBy: 'user-1',
          uploadedAt: new Date(),
        },
      ];

      mockRepoInstance.getQuoteAttachments.mockResolvedValue(mockAttachments);

      const result = await getQuoteAttachments('quote-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].fileName).toBe('document.pdf');
      }
      expect(requirePermission).toHaveBeenCalledWith(mockSession.user, 'canReadQuotes');
    });

    it('returns empty array when no attachments', async () => {
      mockRepoInstance.getQuoteAttachments.mockResolvedValue([]);

      const result = await getQuoteAttachments('quote-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe('getAttachmentDownloadUrl', () => {
    it('returns signed download URL successfully', async () => {
      const mockAttachment = {
        id: 'att-1',
        s3Key: 'quotes/quote-1/document.pdf',
        fileName: 'document.pdf',
      };

      mockRepoInstance.getAttachmentById.mockResolvedValue(mockAttachment);

      const result = await getAttachmentDownloadUrl('att-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.url).toBe('https://signed-url.com/file.pdf');
        expect(result.data.fileName).toBe('document.pdf');
      }
      expect(requirePermission).toHaveBeenCalledWith(mockSession.user, 'canReadQuotes');
    });

    it('returns error when attachment not found', async () => {
      mockRepoInstance.getAttachmentById.mockResolvedValue(null);

      const result = await getAttachmentDownloadUrl('non-existent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Attachment not found');
      }
    });
  });

  describe('getQuoteItemAttachments', () => {
    it('returns item attachments successfully', async () => {
      const mockAttachments = [
        {
          id: 'item-att-1',
          quoteItemId: 'item-1',
          fileName: 'image.jpg',
          fileSize: 2048,
          mimeType: 'image/jpeg',
          s3Key: 'key-1',
          s3Url: 'url-1',
          uploadedBy: 'user-1',
          uploadedAt: new Date(),
        },
      ];

      mockRepoInstance.getQuoteItemAttachments.mockResolvedValue(mockAttachments);

      const result = await getQuoteItemAttachments('item-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].fileName).toBe('image.jpg');
      }
    });
  });

  describe('getItemAttachmentDownloadUrl', () => {
    it('returns signed download URL for item attachment', async () => {
      const mockAttachment = {
        id: 'item-att-1',
        s3Key: 'quotes/items/item-1/image.jpg',
        fileName: 'image.jpg',
      };

      mockRepoInstance.getItemAttachmentById.mockResolvedValue(mockAttachment);

      const result = await getItemAttachmentDownloadUrl('item-att-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.url).toBe('https://signed-url.com/file.pdf');
        expect(result.data.fileName).toBe('image.jpg');
      }
    });

    it('returns error when item attachment not found', async () => {
      mockRepoInstance.getItemAttachmentById.mockResolvedValue(null);

      const result = await getItemAttachmentDownloadUrl('non-existent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Attachment not found');
      }
    });
  });

  describe('getQuoteVersions', () => {
    it('returns quote versions successfully', async () => {
      const mockVersions = [
        {
          id: '1',
          quoteNumber: 'QUO-001-v1',
          versionNumber: 1,
          status: 'DRAFT' as QuoteStatus,
          amount: 1000.0,
          issuedDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          quoteNumber: 'QUO-001-v2',
          versionNumber: 2,
          status: 'SENT' as QuoteStatus,
          amount: 1200.0,
          issuedDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepoInstance.getQuoteVersions.mockResolvedValue(mockVersions);

      const result = await getQuoteVersions('quote-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].amount).toBe(1000);
        expect(result.data[1].amount).toBe(1200);
      }
      expect(requirePermission).toHaveBeenCalledWith(mockSession.user, 'canReadQuotes');
    });

    it('returns empty array when no versions', async () => {
      mockRepoInstance.getQuoteVersions.mockResolvedValue([]);

      const result = await getQuoteVersions('quote-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('converts Decimal amounts to numbers', async () => {
      const mockVersions = [
        {
          id: '1',
          quoteNumber: 'QUO-001',
          versionNumber: 1,
          status: 'DRAFT' as QuoteStatus,
          amount: { toNumber: () => 1500.5 } as any, // Simulate Prisma Decimal
          issuedDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepoInstance.getQuoteVersions.mockResolvedValue(mockVersions);

      const result = await getQuoteVersions('quote-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data[0].amount).toBe('number');
      }
    });
  });
});
