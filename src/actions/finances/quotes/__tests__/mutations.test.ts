import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createQuote,
  updateQuote,
  markQuoteAsAccepted,
  markQuoteAsRejected,
  markQuoteAsSent,
  markQuoteAsOnHold,
  markQuoteAsCancelled,
  convertQuoteToInvoice,
  checkAndExpireQuotes,
  deleteQuote,
  uploadQuoteItemAttachment,
  deleteQuoteItemAttachment,
  updateQuoteItemNotes,
  updateQuoteItemColors,
  createQuoteVersion,
  bulkUpdateQuoteStatus,
  bulkDeleteQuotes,
  duplicateQuote,
} from '../mutations';
import { revalidatePath } from 'next/cache';
import { QuoteStatusSchema } from '@/zod/schemas/enums/QuoteStatus.schema';
import {
  testIds,
  resetIdCounter,
  mockSessions,
  createQuoteInput,
  createQuoteItemInput,
  createQuoteResponse,
  createQuoteVersionResponse,
  createQuoteItemAttachment,
} from '@/lib/testing';

const { mockQuoteRepo, mockInvoiceRepo, mockDeleteFileFromS3, mockAuth, mockHasPermission } =
  vi.hoisted(() => ({
    mockQuoteRepo: {
      createQuoteWithItems: vi.fn(),
      updateQuoteWithItems: vi.fn(),
      findQuoteById: vi.fn(),
      markQuoteAsAccepted: vi.fn(),
      markQuoteAsRejected: vi.fn(),
      markQuoteAsSent: vi.fn(),
      markQuoteAsOnHold: vi.fn(),
      markQuoteAsCancelled: vi.fn(),
      convertQuoteToInvoice: vi.fn(),
      checkAndExpireQuotes: vi.fn(),
      softDeleteQuote: vi.fn(),
      createQuoteItemAttachment: vi.fn(),
      findQuoteItemAttachmentById: vi.fn(),
      deleteQuoteItemAttachment: vi.fn(),
      countQuoteItemAttachmentsByS3Key: vi.fn(),
      updateQuoteItemNotes: vi.fn(),
      updateQuoteItemColors: vi.fn(),
      createQuoteVersion: vi.fn(),
      bulkUpdateQuoteStatus: vi.fn(),
      bulkSoftDeleteQuotes: vi.fn(),
      duplicateQuote: vi.fn(),
    },
    mockInvoiceRepo: {
      generateInvoiceNumber: vi.fn(),
      findByIdWithDetails: vi.fn(),
    },
    mockDeleteFileFromS3: vi.fn(),
    mockAuth: vi.fn(),
    mockHasPermission: vi.fn().mockReturnValue(true),
  }));

// Mock QuoteRepository
vi.mock('@/repositories/quote-repository', () => ({
  QuoteRepository: vi.fn().mockImplementation(function () {
    return mockQuoteRepo;
  }),
}));

// Mock InvoiceRepository
vi.mock('@/repositories/invoice-repository', () => ({
  InvoiceRepository: vi.fn().mockImplementation(function () {
    return mockInvoiceRepo;
  }),
}));

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/permissions', () => ({
  hasPermission: mockHasPermission,
}));

vi.mock('@/lib/s3', () => ({
  uploadFileToS3: vi.fn().mockResolvedValue({
    s3Key: 'test-key',
    s3Url: 'https://test.s3.amazonaws.com/test-key',
  }),
  deleteFileFromS3: (...args: unknown[]) => mockDeleteFileFromS3(...args),
  getSignedUrlForDownload: vi.fn().mockResolvedValue('signed-url'),
  ALLOWED_IMAGE_MIME_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {},
}));

// Generate test IDs using the centralized ID generator
const TEST_CUSTOMER_ID = testIds.customer();
const TEST_QUOTE_ID = testIds.quote();
const TEST_QUOTE_VERSION_ID = testIds.quoteVersion();
const TEST_ITEM_ID = testIds.quoteItem();
const TEST_ATTACHMENT_ID = testIds.attachment();
const TEST_NON_EXISTENT_ID = testIds.nonExistent();

describe('Quote Mutations', () => {
  const mockSession = mockSessions.manager();

  beforeEach(() => {
    vi.clearAllMocks();
    resetIdCounter();
    mockAuth.mockResolvedValue(mockSession);
  });

  describe('createQuote', () => {
    const validData = createQuoteInput({ customerId: TEST_CUSTOMER_ID });

    it('creates a quote successfully when authorized', async () => {
      mockQuoteRepo.createQuoteWithItems.mockResolvedValue(
        createQuoteResponse({ id: TEST_QUOTE_ID, quoteNumber: 'QUO-001' }),
      );

      const result = await createQuote(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_QUOTE_ID);
        expect(result.data.quoteNumber).toBe('QUO-001');
      }
      expect(mockHasPermission).toHaveBeenCalledWith(mockSession.user, 'canManageQuotes');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/quotes');
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await createQuote(validData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('signed in');
      }
    });
  });

  describe('updateQuote', () => {
    const updateData = {
      id: TEST_QUOTE_ID,
      ...createQuoteInput({
        customerId: TEST_CUSTOMER_ID,
        items: [createQuoteItemInput({ description: 'Updated Item', quantity: 2, unitPrice: 150 })],
      }),
    };

    it('updates a quote successfully when authorized', async () => {
      mockQuoteRepo.findQuoteById.mockResolvedValue({ id: TEST_QUOTE_ID });
      mockQuoteRepo.updateQuoteWithItems.mockResolvedValue({ id: TEST_QUOTE_ID });

      const result = await updateQuote(updateData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_QUOTE_ID);
      }
      expect(mockHasPermission).toHaveBeenCalledWith(mockSession.user, 'canManageQuotes');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/quotes');
      expect(revalidatePath).toHaveBeenCalledWith(`/finances/quotes/${TEST_QUOTE_ID}`);
    });

    it('returns error when quote not found', async () => {
      mockQuoteRepo.findQuoteById.mockResolvedValue(null);

      const result = await updateQuote(updateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Quote not found');
      }
    });

    it('returns error when update fails', async () => {
      mockQuoteRepo.findQuoteById.mockResolvedValue({ id: TEST_QUOTE_ID });
      mockQuoteRepo.updateQuoteWithItems.mockResolvedValue(null);

      const result = await updateQuote(updateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Failed to update quote');
      }
    });
  });

  describe('markQuoteAsAccepted', () => {
    it('marks quote as accepted successfully', async () => {
      mockQuoteRepo.markQuoteAsAccepted.mockResolvedValue({ id: TEST_QUOTE_ID });

      const result = await markQuoteAsAccepted({ id: TEST_QUOTE_ID });

      expect(result.success).toBe(true);
      expect(mockHasPermission).toHaveBeenCalledWith(mockSession.user, 'canManageQuotes');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/quotes');
      expect(revalidatePath).toHaveBeenCalledWith(`/finances/quotes/${TEST_QUOTE_ID}`);
    });

    it('returns error when quote not found', async () => {
      mockQuoteRepo.markQuoteAsAccepted.mockResolvedValue(null);

      const result = await markQuoteAsAccepted({ id: TEST_NON_EXISTENT_ID });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Quote not found');
      }
    });
  });

  describe('markQuoteAsRejected', () => {
    it('marks quote as rejected with reason', async () => {
      mockQuoteRepo.markQuoteAsRejected.mockResolvedValue({ id: TEST_QUOTE_ID });

      const result = await markQuoteAsRejected({
        id: TEST_QUOTE_ID,
        rejectReason: 'Price too high',
      });

      expect(result.success).toBe(true);
      expect(mockQuoteRepo.markQuoteAsRejected).toHaveBeenCalledWith(
        TEST_QUOTE_ID,
        expect.any(String),
        'Price too high',
        mockSession.user.id,
      );
    });
  });

  describe('markQuoteAsSent', () => {
    it('marks quote as sent successfully', async () => {
      mockQuoteRepo.markQuoteAsSent.mockResolvedValue({ id: TEST_QUOTE_ID });

      const result = await markQuoteAsSent(TEST_QUOTE_ID);

      expect(result.success).toBe(true);
      expect(mockHasPermission).toHaveBeenCalledWith(mockSession.user, 'canManageQuotes');
    });
  });

  describe('markQuoteAsOnHold', () => {
    it('marks quote as on hold with reason', async () => {
      mockQuoteRepo.markQuoteAsOnHold.mockResolvedValue({ id: TEST_QUOTE_ID });

      const result = await markQuoteAsOnHold({
        id: TEST_QUOTE_ID,
        reason: 'Pending customer approval',
      });

      expect(result.success).toBe(true);
      expect(mockQuoteRepo.markQuoteAsOnHold).toHaveBeenCalledWith(
        TEST_QUOTE_ID,
        expect.any(String),
        'Pending customer approval',
        mockSession.user.id,
      );
    });
  });

  describe('markQuoteAsCancelled', () => {
    it('marks quote as cancelled with reason', async () => {
      mockQuoteRepo.markQuoteAsCancelled.mockResolvedValue({ id: TEST_QUOTE_ID });

      const result = await markQuoteAsCancelled({
        id: TEST_QUOTE_ID,
        cancelReason: 'Customer cancelled',
      });

      expect(result.success).toBe(true);
      expect(revalidatePath).toHaveBeenCalledWith('/finances/quotes');
      expect(revalidatePath).toHaveBeenCalledWith(`/finances/quotes/${TEST_QUOTE_ID}`);
    });
  });

  describe('convertQuoteToInvoice', () => {
    it('converts quote to invoice successfully', async () => {
      mockInvoiceRepo.generateInvoiceNumber.mockResolvedValue('INV-001');
      mockQuoteRepo.convertQuoteToInvoice.mockResolvedValue({
        invoiceId: 'invoice-123',
        invoiceNumber: 'INV-001',
      });

      const result = await convertQuoteToInvoice({
        id: TEST_QUOTE_ID,
        dueDate: new Date(),
        gst: 10,
        discount: 0,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.invoiceId).toBe('invoice-123');
        expect(result.data.invoiceNumber).toBe('INV-001');
      }
      expect(mockHasPermission).toHaveBeenCalledWith(mockSession.user, 'canManageQuotes');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/quotes');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/invoices');
    });
  });

  describe('checkAndExpireQuotes', () => {
    it('expires quotes past validUntil date', async () => {
      mockQuoteRepo.checkAndExpireQuotes.mockResolvedValue(5);

      const result = await checkAndExpireQuotes();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(5);
      }
      expect(revalidatePath).toHaveBeenCalledWith('/finances/quotes');
    });

    it('does not revalidate when no quotes expired', async () => {
      mockQuoteRepo.checkAndExpireQuotes.mockResolvedValue(0);

      await checkAndExpireQuotes();

      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('deleteQuote', () => {
    it('soft deletes a quote successfully', async () => {
      mockQuoteRepo.softDeleteQuote.mockResolvedValue(undefined);

      const result = await deleteQuote(TEST_QUOTE_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_QUOTE_ID);
      }
      expect(mockHasPermission).toHaveBeenCalledWith(mockSession.user, 'canManageQuotes');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/quotes');
    });

    it('returns error when quote not found', async () => {
      const p2025 = Object.assign(new Error('Record not found'), { code: 'P2025' });
      mockQuoteRepo.softDeleteQuote.mockRejectedValue(p2025);

      const result = await deleteQuote(TEST_NON_EXISTENT_ID);

      expect(result.success).toBe(false);
    });
  });

  describe('uploadQuoteItemAttachment', () => {
    it('uploads item attachment successfully', async () => {
      const formData = new FormData();
      const file = new File(['content'], 'image.jpg', { type: 'image/jpeg' });
      formData.append('file', file);
      formData.append('quoteItemId', TEST_ITEM_ID);
      formData.append('quoteId', TEST_QUOTE_ID);

      mockQuoteRepo.createQuoteItemAttachment.mockResolvedValue(
        createQuoteItemAttachment({
          id: TEST_ATTACHMENT_ID,
          quoteItemId: TEST_ITEM_ID,
          uploadedBy: mockSession.user.id,
        }),
      );

      const result = await uploadQuoteItemAttachment(formData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fileName).toBe('image.jpg');
      }
      expect(revalidatePath).toHaveBeenCalledWith(`/finances/quotes/${TEST_QUOTE_ID}`);
    });
  });

  describe('deleteQuoteItemAttachment', () => {
    it('deletes item attachment successfully', async () => {
      mockQuoteRepo.findQuoteItemAttachmentById.mockResolvedValue({
        id: TEST_ATTACHMENT_ID,
        s3Key: 'test-key',
      });
      mockQuoteRepo.deleteQuoteItemAttachment.mockResolvedValue(true);
      mockQuoteRepo.countQuoteItemAttachmentsByS3Key.mockResolvedValue(0);
      mockDeleteFileFromS3.mockResolvedValue(true);

      const result = await deleteQuoteItemAttachment({
        attachmentId: TEST_ATTACHMENT_ID,
        quoteId: TEST_QUOTE_ID,
      });

      expect(result.success).toBe(true);
      expect(revalidatePath).toHaveBeenCalledWith(`/finances/quotes/${TEST_QUOTE_ID}`);
    });
  });

  describe('updateQuoteItemNotes', () => {
    it('updates item notes successfully', async () => {
      mockQuoteRepo.updateQuoteItemNotes.mockResolvedValue({
        id: TEST_ITEM_ID,
        notes: 'Updated notes',
      });

      const result = await updateQuoteItemNotes({
        quoteItemId: TEST_ITEM_ID,
        quoteId: TEST_QUOTE_ID,
        notes: 'Updated notes',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toBe('Updated notes');
      }
      expect(mockHasPermission).toHaveBeenCalledWith(mockSession.user, 'canManageQuotes');
      expect(revalidatePath).toHaveBeenCalledWith(`/finances/quotes/${TEST_QUOTE_ID}`);
    });
  });

  describe('updateQuoteItemColors', () => {
    it('updates item colors successfully', async () => {
      mockQuoteRepo.updateQuoteItemColors.mockResolvedValue({
        id: TEST_ITEM_ID,
        colors: ['#FF5733', '#33FF57'],
      });

      const result = await updateQuoteItemColors({
        quoteItemId: TEST_ITEM_ID,
        quoteId: TEST_QUOTE_ID,
        colors: ['#FF5733', '#33FF57'],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.colors).toEqual(['#FF5733', '#33FF57']);
      }
      expect(revalidatePath).toHaveBeenCalledWith(`/finances/quotes/${TEST_QUOTE_ID}`);
    });

    it('validates hex color format', async () => {
      const result = await updateQuoteItemColors({
        quoteItemId: TEST_ITEM_ID,
        quoteId: TEST_QUOTE_ID,
        colors: ['invalid-color'],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid color format');
      }
    });

    it('validates maximum color limit', async () => {
      const result = await updateQuoteItemColors({
        quoteItemId: TEST_ITEM_ID,
        quoteId: TEST_QUOTE_ID,
        colors: Array(11).fill('#FF5733'), // 11 colors exceeds limit of 10
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Maximum of 10 colors allowed');
      }
    });
  });

  describe('createQuoteVersion', () => {
    it('creates a new quote version successfully', async () => {
      mockQuoteRepo.findQuoteById.mockResolvedValue(
        createQuoteResponse({ id: TEST_QUOTE_ID, quoteNumber: 'QUO-001' }),
      );
      mockQuoteRepo.createQuoteVersion.mockResolvedValue(
        createQuoteVersionResponse({
          id: TEST_QUOTE_VERSION_ID,
          quoteNumber: 'QUO-001-v2',
          versionNumber: 2,
        }),
      );

      const result = await createQuoteVersion({ quoteId: TEST_QUOTE_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_QUOTE_VERSION_ID);
        expect(result.data.quoteNumber).toBe('QUO-001-v2');
        expect(result.data.versionNumber).toBe(2);
        expect(result.data.parentQuoteNumber).toBe('QUO-001');
      }
      expect(mockHasPermission).toHaveBeenCalledWith(mockSession.user, 'canManageQuotes');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/quotes');
      expect(revalidatePath).toHaveBeenCalledWith(`/finances/quotes/${TEST_QUOTE_ID}`);
      expect(revalidatePath).toHaveBeenCalledWith(`/finances/quotes/${TEST_QUOTE_VERSION_ID}`);
    });

    it('returns error when parent quote not found', async () => {
      mockQuoteRepo.findQuoteById.mockResolvedValue(null);

      const result = await createQuoteVersion({ quoteId: TEST_NON_EXISTENT_ID });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Quote not found');
      }
    });
  });

  describe('bulkUpdateQuoteStatus', () => {
    it('should require authentication', async () => {
      mockAuth.mockResolvedValueOnce(null);
      const result = await bulkUpdateQuoteStatus({
        ids: ['id-1'],
        status: QuoteStatusSchema.enum.SENT,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('signed in');
      }
    });

    it('should require permission', async () => {
      mockHasPermission.mockReturnValueOnce(false);

      const result = await bulkUpdateQuoteStatus({
        ids: ['id-1'],
        status: QuoteStatusSchema.enum.SENT,
      });
      expect(result.success).toBe(false);
    });

    it('should call repository bulkUpdateQuoteStatus', async () => {
      mockQuoteRepo.bulkUpdateQuoteStatus.mockResolvedValue([
        { id: 'id-1', success: true },
        { id: 'id-2', success: true },
      ]);

      const result = await bulkUpdateQuoteStatus({
        ids: ['id-1', 'id-2'],
        status: QuoteStatusSchema.enum.SENT,
      });

      expect(mockQuoteRepo.bulkUpdateQuoteStatus).toHaveBeenCalledWith(
        ['id-1', 'id-2'],
        QuoteStatusSchema.enum.SENT,
        expect.any(String),
        mockSession.user.id,
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.successCount).toBe(2);
        expect(result.data.failureCount).toBe(0);
      }
    });

    it('should handle partial failures', async () => {
      mockQuoteRepo.bulkUpdateQuoteStatus.mockResolvedValue([
        { id: 'id-1', success: true },
        { id: 'id-2', success: false, error: 'Failed' },
      ]);

      const result = await bulkUpdateQuoteStatus({
        ids: ['id-1', 'id-2'],
        status: QuoteStatusSchema.enum.SENT,
      });

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
      if (!result.success) {
        expect(result.error).toContain('signed in');
      }
    });

    it('should call repository bulkSoftDeleteQuotes', async () => {
      mockQuoteRepo.bulkSoftDeleteQuotes.mockResolvedValue([{ id: 'id-1', success: true }]);

      const result = await bulkDeleteQuotes(['id-1']);

      expect(mockQuoteRepo.bulkSoftDeleteQuotes).toHaveBeenCalledWith(['id-1'], expect.any(String));
      expect(result.success).toBe(true);
    });

    it('should handle partial failures', async () => {
      mockQuoteRepo.bulkSoftDeleteQuotes.mockResolvedValue([
        { id: 'id-1', success: false, error: 'Not DRAFT' },
      ]);

      const result = await bulkDeleteQuotes(['id-1']);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.failureCount).toBe(1);
      }
    });
  });

  describe('duplicateQuote', () => {
    it('should deny USER role', async () => {
      mockAuth.mockResolvedValue(mockSessions.user());
      mockHasPermission.mockImplementation(
        (user: { role?: string } | undefined, permission: string) => {
          if (permission === 'canManageQuotes' && user?.role === 'USER') return false;
          return true;
        },
      );

      const result = await duplicateQuote(TEST_QUOTE_ID);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('permission');
      }
      expect(mockQuoteRepo.duplicateQuote).not.toHaveBeenCalled();
    });

    it('should allow MANAGER role', async () => {
      mockQuoteRepo.duplicateQuote.mockResolvedValue({
        id: 'new-quote-id',
        quoteNumber: 'QUO-2025-0002',
      });

      const result = await duplicateQuote(TEST_QUOTE_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('new-quote-id');
        expect(result.data.quoteNumber).toBe('QUO-2025-0002');
      }
      expect(mockQuoteRepo.duplicateQuote).toHaveBeenCalledWith(TEST_QUOTE_ID, expect.any(String));
    });

    it('should handle repository errors', async () => {
      mockQuoteRepo.duplicateQuote.mockRejectedValue(new Error('DB Error'));

      const result = await duplicateQuote(TEST_QUOTE_ID);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('DB Error');
      }
    });
  });

  describe('deleteQuoteItemAttachment (Shared File Safety)', () => {
    const attachmentData = {
      attachmentId: TEST_ATTACHMENT_ID,
      quoteId: TEST_QUOTE_ID,
    };

    const mockAttachment = {
      id: TEST_ATTACHMENT_ID,
      s3Key: 'shared-file-key.jpg',
    };

    beforeEach(() => {
      mockQuoteRepo.findQuoteItemAttachmentById.mockResolvedValue(mockAttachment);
      mockQuoteRepo.deleteQuoteItemAttachment.mockResolvedValue(true);
      mockQuoteRepo.countQuoteItemAttachmentsByS3Key.mockResolvedValue(0);
      mockDeleteFileFromS3.mockResolvedValue(true);
    });

    it('should DELETE file from S3 if it is NOT used by other quotes', async () => {
      mockQuoteRepo.countQuoteItemAttachmentsByS3Key.mockResolvedValue(0);

      const result = await deleteQuoteItemAttachment(attachmentData);

      expect(result.success).toBe(true);
      expect(mockQuoteRepo.countQuoteItemAttachmentsByS3Key).toHaveBeenCalledWith(
        'shared-file-key.jpg',
        TEST_ATTACHMENT_ID,
      );
      expect(mockDeleteFileFromS3).toHaveBeenCalledWith('shared-file-key.jpg');
      expect(mockQuoteRepo.deleteQuoteItemAttachment).toHaveBeenCalledWith(TEST_ATTACHMENT_ID);
    });

    it('should SKIP deleting file from S3 if it IS used by other duplicates', async () => {
      mockQuoteRepo.countQuoteItemAttachmentsByS3Key.mockResolvedValue(1);

      const result = await deleteQuoteItemAttachment(attachmentData);

      expect(result.success).toBe(true);
      expect(mockQuoteRepo.countQuoteItemAttachmentsByS3Key).toHaveBeenCalled();
      expect(mockDeleteFileFromS3).not.toHaveBeenCalled();
      expect(mockQuoteRepo.deleteQuoteItemAttachment).toHaveBeenCalledWith(TEST_ATTACHMENT_ID);
    });

    it('should handle attachment not found', async () => {
      mockQuoteRepo.findQuoteItemAttachmentById.mockResolvedValue(null);

      const result = await deleteQuoteItemAttachment(attachmentData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Attachment not found');
      }
      expect(mockDeleteFileFromS3).not.toHaveBeenCalled();
    });
  });
});

describe('Quote Mutations - Permission Tests', () => {
  const mockUserRole = mockSessions.user();
  const mockManagerRole = mockSessions.manager();
  const mockAdminRole = mockSessions.admin();

  // Helper to make permission mock return false for USER role on manage permissions
  const setupPermissionMock = () => {
    mockHasPermission.mockImplementation(
      (user: { role?: string } | undefined, permission: string) => {
        if (
          permission === 'canManageQuotes' &&
          (user?.role === 'USER' || user?.role === 'INVALID_ROLE')
        ) {
          return false;
        }
        return true;
      },
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createQuote', () => {
    const validQuoteData = createQuoteInput({ customerId: TEST_CUSTOMER_ID });

    it('should DENY USER role from creating quotes', async () => {
      mockAuth.mockResolvedValue(mockUserRole);
      setupPermissionMock();

      const result = await createQuote(validQuoteData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('permission');
      }
    });

    it('should ALLOW MANAGER role to create quotes', async () => {
      mockAuth.mockResolvedValue(mockManagerRole);
      mockQuoteRepo.createQuoteWithItems.mockResolvedValue({
        id: '1',
        quoteNumber: 'QUO-2024-0001',
      });

      const result = await createQuote(validQuoteData);

      expect(result.success).toBe(true);
    });

    it('should ALLOW ADMIN role to create quotes', async () => {
      mockAuth.mockResolvedValue(mockAdminRole);
      mockQuoteRepo.createQuoteWithItems.mockResolvedValue({
        id: '1',
        quoteNumber: 'QUO-2024-0001',
      });

      const result = await createQuote(validQuoteData);

      expect(result.success).toBe(true);
    });
  });

  describe('updateQuote', () => {
    const updateData = {
      id: TEST_QUOTE_ID,
      ...createQuoteInput({
        customerId: TEST_CUSTOMER_ID,
        items: [createQuoteItemInput({ description: 'Updated Item', quantity: 2, unitPrice: 150 })],
      }),
    };

    it('should DENY USER role from updating quotes', async () => {
      mockAuth.mockResolvedValue(mockUserRole);
      setupPermissionMock();

      const result = await updateQuote(updateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('permission');
      }
    });

    it('should ALLOW MANAGER role to update quotes', async () => {
      mockAuth.mockResolvedValue(mockManagerRole);
      mockQuoteRepo.findQuoteById.mockResolvedValue({ id: TEST_QUOTE_ID, status: 'DRAFT' });
      mockQuoteRepo.updateQuoteWithItems.mockResolvedValue({ id: TEST_QUOTE_ID });

      const result = await updateQuote(updateData);

      expect(result.success).toBe(true);
    });
  });

  describe('deleteQuote', () => {
    it('should DENY USER role from deleting quotes', async () => {
      mockAuth.mockResolvedValue(mockUserRole);
      setupPermissionMock();

      const result = await deleteQuote(TEST_QUOTE_ID);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('permission');
      }
    });

    it('should ALLOW MANAGER role to delete quotes', async () => {
      mockAuth.mockResolvedValue(mockManagerRole);
      mockQuoteRepo.softDeleteQuote.mockResolvedValue(undefined);

      const result = await deleteQuote(TEST_QUOTE_ID);

      expect(result.success).toBe(true);
    });

    it('should ALLOW ADMIN role to delete quotes', async () => {
      mockAuth.mockResolvedValue(mockAdminRole);
      mockQuoteRepo.softDeleteQuote.mockResolvedValue(undefined);

      const result = await deleteQuote(TEST_QUOTE_ID);

      expect(result.success).toBe(true);
    });
  });

  describe('markQuoteAsAccepted', () => {
    it('should DENY USER role from marking quotes as accepted', async () => {
      mockAuth.mockResolvedValue(mockUserRole);
      setupPermissionMock();

      const result = await markQuoteAsAccepted({ id: TEST_QUOTE_ID });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('permission');
      }
    });

    it('should ALLOW MANAGER role to mark quotes as accepted', async () => {
      mockAuth.mockResolvedValue(mockManagerRole);
      mockQuoteRepo.markQuoteAsAccepted.mockResolvedValue({
        id: TEST_QUOTE_ID,
        status: 'ACCEPTED',
      });

      const result = await markQuoteAsAccepted({ id: TEST_QUOTE_ID });

      expect(result.success).toBe(true);
    });
  });

  describe('convertQuoteToInvoice', () => {
    const conversionData = {
      id: TEST_QUOTE_ID,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      gst: 10,
      discount: 0,
    };

    it('should DENY USER role from converting quotes', async () => {
      mockAuth.mockResolvedValue(mockUserRole);
      setupPermissionMock();

      const result = await convertQuoteToInvoice(conversionData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('permission');
      }
    });

    it('should ALLOW MANAGER role to convert quotes', async () => {
      mockAuth.mockResolvedValue(mockManagerRole);
      mockInvoiceRepo.generateInvoiceNumber.mockResolvedValue('INV-2024-0001');
      mockQuoteRepo.convertQuoteToInvoice.mockResolvedValue({
        invoiceId: '1',
        invoiceNumber: 'INV-2024-0001',
      });

      const result = await convertQuoteToInvoice(conversionData);

      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing user session', async () => {
      mockAuth.mockResolvedValue(mockSessions.invalidSession());

      const result = await createQuote(createQuoteInput({ customerId: TEST_CUSTOMER_ID }));

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('signed in');
      }
    });

    it('should handle invalid role', async () => {
      const invalidSession = {
        user: {
          id: 'test',
          email: 'test@example.com',
          role: 'INVALID_ROLE' as const,
        },
      };
      mockAuth.mockResolvedValue(invalidSession);
      setupPermissionMock();

      const result = await createQuote(createQuoteInput({ customerId: TEST_CUSTOMER_ID }));

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('permission');
      }
    });
  });
});
