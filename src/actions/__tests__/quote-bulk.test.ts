import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bulkUpdateQuoteStatus, bulkDeleteQuotes } from '@/actions/quotes/mutations';
import { QuoteStatusSchema } from '@/zod/schemas/enums/QuoteStatus.schema';

const { mockQuoteRepo, mockRequirePermission, mockAuth } = vi.hoisted(() => {
  return {
    mockQuoteRepo: {
      bulkUpdateStatus: vi.fn(),
      bulkSoftDelete: vi.fn(),
    },
    mockRequirePermission: vi.fn(),
    mockAuth: vi.fn(),
  };
});

// Mock QuoteRepository
vi.mock('@/repositories/quote-repository', () => ({
  QuoteRepository: class {
    constructor() {
      return mockQuoteRepo;
    }
  },
}));

// Mock permissions
vi.mock('@/lib/permissions', () => ({
  requirePermission: mockRequirePermission,
}));

// Mock auth
vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Quote Bulk Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default auth mock for successful permission check
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    });
  });

  describe('bulkUpdateQuoteStatus', () => {
    it('should require authentication', async () => {
      mockAuth.mockResolvedValueOnce(null);
      const result = await bulkUpdateQuoteStatus(['id-1'], QuoteStatusSchema.enum.SENT);
      expect(result.success).toBe(false);
      expect((result as any).error).toBe('Unauthorized');
    });

    it('should require permission', async () => {
      mockRequirePermission.mockImplementationOnce(() => {
        throw new Error('Permission denied');
      });

      const result = await bulkUpdateQuoteStatus(['id-1'], QuoteStatusSchema.enum.SENT);
      expect(result.success).toBe(false);
    });

    it('should call repository bulkUpdateStatus', async () => {
      mockQuoteRepo.bulkUpdateStatus.mockResolvedValue([
        { id: 'id-1', success: true },
        { id: 'id-2', success: true },
      ]);

      const result = await bulkUpdateQuoteStatus(['id-1', 'id-2'], QuoteStatusSchema.enum.SENT);

      expect(mockQuoteRepo.bulkUpdateStatus).toHaveBeenCalledWith(
        ['id-1', 'id-2'],
        QuoteStatusSchema.enum.SENT,
        'user-1',
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.successCount).toBe(2);
        expect(result.data.failureCount).toBe(0);
      }
    });

    it('should handle partial failures', async () => {
      mockQuoteRepo.bulkUpdateStatus.mockResolvedValue([
        { id: 'id-1', success: true },
        { id: 'id-2', success: false, error: 'Failed' },
      ]);

      const result = await bulkUpdateQuoteStatus(['id-1', 'id-2'], QuoteStatusSchema.enum.SENT);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.successCount).toBe(1);
        expect(result.data.failureCount).toBe(1);
        expect(result.data.results).toHaveLength(2);
      }
    });
  });

  describe('bulkDeleteQuotes', () => {
    it('should require authentication', async () => {
      mockAuth.mockResolvedValueOnce(null);
      const result = await bulkDeleteQuotes(['id-1']);
      expect(result.success).toBe(false);
      expect((result as any).error).toBe('Unauthorized');
    });

    it('should call repository bulkSoftDelete', async () => {
      mockQuoteRepo.bulkSoftDelete.mockResolvedValue([{ id: 'id-1', success: true }]);

      const result = await bulkDeleteQuotes(['id-1']);

      expect(mockQuoteRepo.bulkSoftDelete).toHaveBeenCalledWith(['id-1']);
      expect(result.success).toBe(true);
    });

    it('should handle partial failures', async () => {
      mockQuoteRepo.bulkSoftDelete.mockResolvedValue([
        { id: 'id-1', success: false, error: 'Not DRAFT' },
      ]);

      const result = await bulkDeleteQuotes(['id-1']);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.failureCount).toBe(1);
      }
    });
  });
});
