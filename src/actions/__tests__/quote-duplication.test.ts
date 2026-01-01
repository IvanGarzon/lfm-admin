/**
 * Tests for Quote Duplication Logic
 *
 * Tests:
 * - duplicateQuote action
 * - Safe deletion of shared attachments
 *
 * Run with: npm test quote-duplication
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import type { Session } from 'next-auth';
import * as quoteActions from '../quotes';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

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

// Mock prisma directly for the raw count query we added
vi.mock('@/lib/prisma', () => ({
  prisma: {
    quoteItemAttachment: {
      count: vi.fn(),
    },
  },
}));

// Mock S3 functions
const mockDeleteFileFromS3 = vi.fn();

vi.mock('@/lib/s3', () => ({
  uploadFileToS3: vi.fn().mockResolvedValue({ key: 'test-key', url: 'test-url' }),
  deleteFileFromS3: (...args: any[]) => mockDeleteFileFromS3(...args),
  getSignedUrlForDownload: vi.fn().mockResolvedValue('signed-url'),
  ALLOWED_IMAGE_MIME_TYPES: ['image/jpeg', 'image/png'],
}));

// Mock the repository - using vi.hoisted to ensure availability in mock factory
const mockQuoteRepo = vi.hoisted(() => ({
  duplicate: vi.fn(),
  getItemAttachmentById: vi.fn(),
  deleteItemAttachment: vi.fn(),
}));

vi.mock('@/repositories/quote-repository', () => ({
  QuoteRepository: class MockQuoteRepository {
    duplicate = mockQuoteRepo.duplicate;
    getItemAttachmentById = mockQuoteRepo.getItemAttachmentById;
    deleteItemAttachment = mockQuoteRepo.deleteItemAttachment;
  },
}));

// Mock user sessions
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

describe('Quote Duplication & Safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteFileFromS3.mockResolvedValue(true);
  });

  describe('duplicateQuote', () => {
    it('should deny USER role', async () => {
      mockAuth.mockResolvedValue(mockUserRole);

      const result = await quoteActions.duplicateQuote('quote-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
      expect(mockQuoteRepo.duplicate).not.toHaveBeenCalled();
    });

    it('should allow MANAGER role', async () => {
      mockAuth.mockResolvedValue(mockManagerRole);
      mockQuoteRepo.duplicate.mockResolvedValue({
        id: 'new-quote-id',
        quoteNumber: 'QUO-2025-0002',
      });

      const result = await quoteActions.duplicateQuote('quote-id');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('new-quote-id');
        expect(result.data.quoteNumber).toBe('QUO-2025-0002');
      }
      expect(mockQuoteRepo.duplicate).toHaveBeenCalledWith('quote-id');
    });

    it('should handle repository errors', async () => {
      mockAuth.mockResolvedValue(mockManagerRole);
      mockQuoteRepo.duplicate.mockRejectedValue(new Error('DB Error'));

      const result = await quoteActions.duplicateQuote('quote-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('DB Error');
    });
  });

  describe('deleteQuoteItemAttachment (Shared File Safety)', () => {
    const attachmentData = {
      attachmentId: 'att-1',
      quoteId: 'quote-1',
    };

    const mockAttachment = {
      id: 'att-1',
      s3Key: 'shared-file-key.jpg',
    };

    beforeEach(() => {
      mockAuth.mockResolvedValue(mockManagerRole);
      mockQuoteRepo.getItemAttachmentById.mockResolvedValue(mockAttachment);
      mockQuoteRepo.deleteItemAttachment.mockResolvedValue(true);
    });

    it('should DELETE file from S3 if it is NOT used by other quotes', async () => {
      // Mock count to return 0 (no other usage)
      (prisma.quoteItemAttachment.count as unknown as MockedFunction<any>).mockResolvedValue(0);

      const result = await quoteActions.deleteQuoteItemAttachment(attachmentData);

      expect(result.success).toBe(true);
      // Should check count excluding current ID
      expect(prisma.quoteItemAttachment.count).toHaveBeenCalledWith({
        where: {
          s3Key: 'shared-file-key.jpg',
          id: { not: 'att-1' },
        },
      });
      // Should proceed to delete from S3
      expect(mockDeleteFileFromS3).toHaveBeenCalledWith('shared-file-key.jpg');
      // Should delete record
      expect(mockQuoteRepo.deleteItemAttachment).toHaveBeenCalledWith('att-1');
    });

    it('should SKIP deleting file from S3 if it IS used by other duplicates', async () => {
      // Mock count to return 1 (used by another duplicate)
      (prisma.quoteItemAttachment.count as unknown as MockedFunction<any>).mockResolvedValue(1);

      const result = await quoteActions.deleteQuoteItemAttachment(attachmentData);

      expect(result.success).toBe(true);
      expect(prisma.quoteItemAttachment.count).toHaveBeenCalled();

      // CRITICAL: Should NOT accept deletion from S3
      expect(mockDeleteFileFromS3).not.toHaveBeenCalled();

      // But SHOULD delete the database record for this specific quote link
      expect(mockQuoteRepo.deleteItemAttachment).toHaveBeenCalledWith('att-1');
    });

    it('should handle attachment not found', async () => {
      mockQuoteRepo.getItemAttachmentById.mockResolvedValue(null);

      const result = await quoteActions.deleteQuoteItemAttachment(attachmentData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Attachment not found');
      expect(mockDeleteFileFromS3).not.toHaveBeenCalled();
    });
  });
});
