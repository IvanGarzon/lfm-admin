import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getQuotes,
  getQuoteById,
  getQuoteStatistics,
  getQuoteItemAttachments,
  getItemAttachmentDownloadUrl,
  getQuoteVersions,
} from '../queries';
import { QuoteStatus } from '@/prisma/client';
import { mockSessions } from '@/lib/testing';

const { mockRepoInstance, mockAuth, mockHasPermission } = vi.hoisted(() => ({
  mockRepoInstance: {
    searchQuotes: vi.fn(),
    findQuoteById: vi.fn(),
    getQuoteStatistics: vi.fn(),
    findQuoteItemAttachments: vi.fn(),
    findQuoteItemAttachmentById: vi.fn(),
    getQuoteVersions: vi.fn(),
  },
  mockAuth: vi.fn(),
  mockHasPermission: vi.fn().mockReturnValue(true),
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
  auth: mockAuth,
}));

vi.mock('@/lib/permissions', () => ({
  hasPermission: mockHasPermission,
}));

vi.mock('@/lib/s3', () => ({
  getSignedDownloadUrl: vi.fn().mockResolvedValue('https://signed-url.com/file.pdf'),
}));

describe('Quote Queries', () => {
  const mockSession = mockSessions.manager();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
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

      mockRepoInstance.searchQuotes.mockResolvedValue(mockResult);

      const result = await getQuotes({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockResult);
      }
      expect(mockHasPermission).toHaveBeenCalledWith(mockSession.user, 'canReadQuotes');
      expect(mockRepoInstance.searchQuotes).toHaveBeenCalled();
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await getQuotes({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('signed in');
      }
    });

    it('coerces invalid query parameters to defaults', async () => {
      const mockResult = {
        items: [],
        pagination: { page: 1, perPage: 20, total: 0 },
      };

      mockRepoInstance.searchQuotes.mockResolvedValue(mockResult);

      // nuqs parsers are lenient - invalid values get coerced to defaults
      const result = await getQuotes({ page: 'invalid' } as any);

      expect(result.success).toBe(true);
      expect(mockRepoInstance.searchQuotes).toHaveBeenCalled();
    });

    it('applies filters correctly', async () => {
      const mockResult = {
        items: [{ id: '1', quoteNumber: 'QUO-001', status: 'DRAFT' }],
        pagination: { page: 1, perPage: 10, total: 1 },
      };

      mockRepoInstance.searchQuotes.mockResolvedValue(mockResult);

      await getQuotes({ status: 'DRAFT', search: 'test' });

      expect(mockRepoInstance.searchQuotes).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'test',
        }),
        expect.any(String),
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

      mockRepoInstance.findQuoteById.mockResolvedValue(mockQuote);

      const result = await getQuoteById('1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockQuote);
      }
      expect(mockHasPermission).toHaveBeenCalledWith(mockSession.user, 'canReadQuotes');
    });

    it('returns error when quote not found', async () => {
      mockRepoInstance.findQuoteById.mockResolvedValue(null);

      const result = await getQuoteById('non-existent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Quote not found');
      }
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await getQuoteById('1');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('signed in');
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

      mockRepoInstance.getQuoteStatistics.mockResolvedValue(mockStats);

      const result = await getQuoteStatistics();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockStats);
      }
      expect(mockHasPermission).toHaveBeenCalledWith(mockSession.user, 'canReadQuotes');
    });

    it('returns statistics with date filter', async () => {
      const mockStats = { total: 50, draft: 10, sent: 15 };
      mockRepoInstance.getQuoteStatistics.mockResolvedValue(mockStats);

      const dateFilter = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = await getQuoteStatistics(dateFilter);

      expect(result.success).toBe(true);
      expect(mockRepoInstance.getQuoteStatistics).toHaveBeenCalledWith(
        expect.any(String),
        dateFilter,
      );
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await getQuoteStatistics();
      expect(result.success).toBe(false);
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

      mockRepoInstance.findQuoteItemAttachments.mockResolvedValue(mockAttachments);

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

      mockRepoInstance.findQuoteItemAttachmentById.mockResolvedValue(mockAttachment);

      const result = await getItemAttachmentDownloadUrl('item-att-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.url).toBe('https://signed-url.com/file.pdf');
        expect(result.data.fileName).toBe('image.jpg');
      }
    });

    it('returns error when item attachment not found', async () => {
      mockRepoInstance.findQuoteItemAttachmentById.mockResolvedValue(null);

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
      expect(mockHasPermission).toHaveBeenCalledWith(mockSession.user, 'canReadQuotes');
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
          amount: { toNumber: () => 1500.5 }, // Simulate Prisma Decimal
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

describe('Quote Queries - Permission Tests', () => {
  const mockUserRole = mockSessions.user();
  const mockManagerRole = mockSessions.manager();
  const mockAdminRole = mockSessions.admin();

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepoInstance.searchQuotes.mockResolvedValue({ items: [], pagination: {} });
    mockRepoInstance.findQuoteById.mockResolvedValue({ id: '1', status: 'DRAFT' });
  });

  describe('getQuotes', () => {
    it('should allow USER role to read quotes', async () => {
      mockAuth.mockResolvedValue(mockUserRole);

      const result = await getQuotes({});

      expect(result.success).toBe(true);
    });

    it('should allow MANAGER role to read quotes', async () => {
      mockAuth.mockResolvedValue(mockManagerRole);

      const result = await getQuotes({});

      expect(result.success).toBe(true);
    });

    it('should allow ADMIN role to read quotes', async () => {
      mockAuth.mockResolvedValue(mockAdminRole);

      const result = await getQuotes({});

      expect(result.success).toBe(true);
    });

    it('should deny unauthenticated users', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getQuotes({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('signed in');
      }
    });
  });

  describe('getQuoteById', () => {
    it('should allow USER role to read quote details', async () => {
      mockAuth.mockResolvedValue(mockUserRole);

      const result = await getQuoteById('test-id');

      expect(result.success).toBe(true);
    });
  });
});
