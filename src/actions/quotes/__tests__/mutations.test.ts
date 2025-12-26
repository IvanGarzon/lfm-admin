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
  uploadQuoteAttachment,
  deleteQuoteAttachment,
  uploadQuoteItemAttachment,
  deleteQuoteItemAttachment,
  updateQuoteItemNotes,
  updateQuoteItemColors,
  createQuoteVersion,
} from '../mutations';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/permissions';
import { QuoteRepository } from '@/repositories/quote-repository';
import { InvoiceRepository } from '@/repositories/invoice-repository';

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

const { mockQuoteRepo, mockInvoiceRepo } = vi.hoisted(() => ({
  mockQuoteRepo: {
    createQuoteWithItems: vi.fn(),
    updateQuoteWithItems: vi.fn(),
    findById: vi.fn(),
    markAsAccepted: vi.fn(),
    markAsRejected: vi.fn(),
    markAsSent: vi.fn(),
    markAsOnHold: vi.fn(),
    markAsCancelled: vi.fn(),
    convertToInvoice: vi.fn(),
    checkAndExpireQuotes: vi.fn(),
    softDelete: vi.fn(),
    createAttachment: vi.fn(),
    getAttachmentById: vi.fn(),
    deleteAttachment: vi.fn(),
    createItemAttachment: vi.fn(),
    getItemAttachmentById: vi.fn(),
    deleteItemAttachment: vi.fn(),
    updateQuoteItemNotes: vi.fn(),
    updateQuoteItemColors: vi.fn(),
    createVersion: vi.fn(),
  },
  mockInvoiceRepo: {
    generateInvoiceNumber: vi.fn(),
  },
}));

// Mock QuoteRepository
vi.mock('@/repositories/quote-repository', () => ({
  QuoteRepository: vi.fn().mockImplementation(function() {
    return mockQuoteRepo;
  }),
}));

// Mock InvoiceRepository
vi.mock('@/repositories/invoice-repository', () => ({
  InvoiceRepository: vi.fn().mockImplementation(function() {
    return mockInvoiceRepo;
  }),
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/permissions', () => ({
  requirePermission: vi.fn(),
}));

vi.mock('@/lib/s3', () => ({
  uploadFileToS3: vi.fn().mockResolvedValue({
    s3Key: 'test-key',
    s3Url: 'https://test.s3.amazonaws.com/test-key',
  }),
  deleteFileFromS3: vi.fn().mockResolvedValue(true),
  ALLOWED_IMAGE_MIME_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
}));

describe('Quote Mutations', () => {
  const mockSession = {
    user: { id: 'user_123', email: 'test@example.com', role: 'MANAGER' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue(mockSession);
  });

  describe('createQuote', () => {
    const validData = {
      customerId: 'cust-123',
      status: 'DRAFT' as const,
      issuedDate: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      currency: 'AUD',
      gst: 10,
      discount: 0,
      items: [{ description: 'Item 1', quantity: 1, unitPrice: 100, productId: null, colors: [] }],
    };

    it('creates a quote successfully when authorized', async () => {
      mockQuoteRepo.createQuoteWithItems.mockResolvedValue({
        id: 'quote-123',
        quoteNumber: 'QUO-001',
      });

      const result = await createQuote(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('quote-123');
        expect(result.data.quoteNumber).toBe('QUO-001');
      }
      expect(requirePermission).toHaveBeenCalledWith(mockSession.user, 'canManageQuotes');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/quotes');
    });

    it('returns unauthorized when no session', async () => {
      (auth as any).mockResolvedValue(null);
      const result = await createQuote(validData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unauthorized');
      }
    });
  });

  describe('updateQuote', () => {
    const updateData = {
      id: 'quote-123',
      customerId: 'cust-123',
      status: 'DRAFT' as const,
      issuedDate: new Date(),
      validUntil: new Date(),
      currency: 'AUD',
      gst: 10,
      discount: 0,
      items: [{ description: 'Updated Item', quantity: 2, unitPrice: 150, productId: null, colors: [] }],
    };

    it('updates a quote successfully when authorized', async () => {
      mockQuoteRepo.findById.mockResolvedValue({ id: 'quote-123' });
      mockQuoteRepo.updateQuoteWithItems.mockResolvedValue({ id: 'quote-123' });

      const result = await updateQuote(updateData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('quote-123');
      }
      expect(requirePermission).toHaveBeenCalledWith(mockSession.user, 'canManageQuotes');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/quotes');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/quotes/quote-123');
    });

    it('returns error when quote not found', async () => {
      mockQuoteRepo.findById.mockResolvedValue(null);

      const result = await updateQuote(updateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Quote not found');
      }
    });

    it('returns error when update fails', async () => {
      mockQuoteRepo.findById.mockResolvedValue({ id: 'quote-123' });
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
      mockQuoteRepo.markAsAccepted.mockResolvedValue({ id: 'quote-123' });

      const result = await markQuoteAsAccepted({ id: 'quote-123' });

      expect(result.success).toBe(true);
      expect(requirePermission).toHaveBeenCalledWith(mockSession.user, 'canManageQuotes');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/quotes');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/quotes/quote-123');
    });

    it('returns error when quote not found', async () => {
      mockQuoteRepo.markAsAccepted.mockResolvedValue(null);

      const result = await markQuoteAsAccepted({ id: 'non-existent' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Quote not found');
      }
    });
  });

  describe('markQuoteAsRejected', () => {
    it('marks quote as rejected with reason', async () => {
      mockQuoteRepo.markAsRejected.mockResolvedValue({ id: 'quote-123' });

      const result = await markQuoteAsRejected({
        id: 'quote-123',
        rejectReason: 'Price too high',
      });

      expect(result.success).toBe(true);
      expect(mockQuoteRepo.markAsRejected).toHaveBeenCalledWith(
        'quote-123',
        'Price too high',
        mockSession.user.id
      );
    });
  });

  describe('markQuoteAsSent', () => {
    it('marks quote as sent successfully', async () => {
      mockQuoteRepo.markAsSent.mockResolvedValue({ id: 'quote-123' });

      const result = await markQuoteAsSent('quote-123');

      expect(result.success).toBe(true);
      expect(requirePermission).toHaveBeenCalledWith(mockSession.user, 'canManageQuotes');
    });
  });

  describe('markQuoteAsOnHold', () => {
    it('marks quote as on hold with reason', async () => {
      mockQuoteRepo.markAsOnHold.mockResolvedValue({ id: 'quote-123' });

      const result = await markQuoteAsOnHold({
        id: 'quote-123',
        reason: 'Pending customer approval',
      });

      expect(result.success).toBe(true);
      expect(mockQuoteRepo.markAsOnHold).toHaveBeenCalledWith(
        'quote-123',
        'Pending customer approval',
        mockSession.user.id
      );
    });
  });

  describe('markQuoteAsCancelled', () => {
    it('marks quote as cancelled with reason', async () => {
      mockQuoteRepo.markAsCancelled.mockResolvedValue({ id: 'quote-123' });

      const result = await markQuoteAsCancelled({
        id: 'quote-123',
        reason: 'Customer cancelled',
      });

      expect(result.success).toBe(true);
      expect(revalidatePath).toHaveBeenCalledWith('/finances/quotes');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/quotes/quote-123');
    });
  });

  describe('convertQuoteToInvoice', () => {
    it('converts quote to invoice successfully', async () => {
      mockInvoiceRepo.generateInvoiceNumber.mockResolvedValue('INV-001');
      mockQuoteRepo.convertToInvoice.mockResolvedValue({
        invoiceId: 'invoice-123',
        invoiceNumber: 'INV-001',
      });

      const result = await convertQuoteToInvoice({
        id: 'quote-123',
        dueDate: new Date(),
        gst: 10,
        discount: 0,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.invoiceId).toBe('invoice-123');
        expect(result.data.invoiceNumber).toBe('INV-001');
      }
      expect(requirePermission).toHaveBeenCalledWith(mockSession.user, 'canManageQuotes');
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
      mockQuoteRepo.softDelete.mockResolvedValue(true);

      const result = await deleteQuote('quote-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('quote-123');
      }
      expect(requirePermission).toHaveBeenCalledWith(mockSession.user, 'canManageQuotes');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/quotes');
    });

    it('returns error when quote not found', async () => {
      mockQuoteRepo.softDelete.mockResolvedValue(false);

      const result = await deleteQuote('non-existent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Quote not found');
      }
    });
  });

  describe('uploadQuoteAttachment', () => {
    it('uploads attachment successfully', async () => {
      const formData = new FormData();
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      formData.append('file', file);
      formData.append('quoteId', 'quote-123');

      mockQuoteRepo.findById.mockResolvedValue({ id: 'quote-123' });
      mockQuoteRepo.createAttachment.mockResolvedValue({
        id: 'att-123',
        quoteId: 'quote-123',
        fileName: 'document.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        s3Key: 'test-key',
        s3Url: 'https://test.s3.amazonaws.com/test-key',
        uploadedBy: 'user_123',
        uploadedAt: new Date(),
      });

      const result = await uploadQuoteAttachment(formData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fileName).toBe('document.pdf');
      }
      expect(requirePermission).toHaveBeenCalledWith(mockSession.user, 'canManageQuotes');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/quotes/quote-123');
    });

    it('returns error when quote not found', async () => {
      const formData = new FormData();
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      formData.append('file', file);
      formData.append('quoteId', 'non-existent');

      mockQuoteRepo.findById.mockResolvedValue(null);

      const result = await uploadQuoteAttachment(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Quote not found');
      }
    });

    it('returns error when missing required fields', async () => {
      const formData = new FormData();

      const result = await uploadQuoteAttachment(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Missing required fields');
      }
    });
  });

  describe('deleteQuoteAttachment', () => {
    it('deletes attachment successfully', async () => {
      mockQuoteRepo.getAttachmentById.mockResolvedValue({
        id: 'att-123',
        quoteId: 'quote-123',
        s3Key: 'test-key',
      });
      mockQuoteRepo.deleteAttachment.mockResolvedValue(true);

      const result = await deleteQuoteAttachment({ attachmentId: 'att-123' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('att-123');
      }
      expect(requirePermission).toHaveBeenCalledWith(mockSession.user, 'canManageQuotes');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/quotes/quote-123');
    });

    it('returns error when attachment not found', async () => {
      mockQuoteRepo.getAttachmentById.mockResolvedValue(null);

      const result = await deleteQuoteAttachment({ attachmentId: 'non-existent' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Attachment not found');
      }
    });
  });

  describe('uploadQuoteItemAttachment', () => {
    it('uploads item attachment successfully', async () => {
      const formData = new FormData();
      const file = new File(['content'], 'image.jpg', { type: 'image/jpeg' });
      formData.append('file', file);
      formData.append('quoteItemId', 'item-123');
      formData.append('quoteId', 'quote-123');

      mockQuoteRepo.createItemAttachment.mockResolvedValue({
        id: 'item-att-123',
        quoteItemId: 'item-123',
        fileName: 'image.jpg',
        fileSize: 2048,
        mimeType: 'image/jpeg',
        s3Key: 'test-key',
        s3Url: 'https://test.s3.amazonaws.com/test-key',
        uploadedBy: 'user_123',
        uploadedAt: new Date(),
      });

      const result = await uploadQuoteItemAttachment(formData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fileName).toBe('image.jpg');
      }
      expect(revalidatePath).toHaveBeenCalledWith('/finances/quotes/quote-123');
    });
  });

  describe('deleteQuoteItemAttachment', () => {
    it('deletes item attachment successfully', async () => {
      mockQuoteRepo.getItemAttachmentById.mockResolvedValue({
        id: 'item-att-123',
        s3Key: 'test-key',
      });
      mockQuoteRepo.deleteItemAttachment.mockResolvedValue(true);

      const result = await deleteQuoteItemAttachment({
        attachmentId: 'item-att-123',
        quoteId: 'quote-123',
      });

      expect(result.success).toBe(true);
      expect(revalidatePath).toHaveBeenCalledWith('/finances/quotes/quote-123');
    });
  });

  describe('updateQuoteItemNotes', () => {
    it('updates item notes successfully', async () => {
      mockQuoteRepo.updateQuoteItemNotes.mockResolvedValue({
        id: 'item-123',
        notes: 'Updated notes',
      });

      const result = await updateQuoteItemNotes({
        quoteItemId: 'item-123',
        quoteId: 'quote-123',
        notes: 'Updated notes',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toBe('Updated notes');
      }
      expect(requirePermission).toHaveBeenCalledWith(mockSession.user, 'canManageQuotes');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/quotes/quote-123');
    });
  });

  describe('updateQuoteItemColors', () => {
    it('updates item colors successfully', async () => {
      mockQuoteRepo.updateQuoteItemColors.mockResolvedValue({
        id: 'item-123',
        colors: ['#FF5733', '#33FF57'],
      });

      const result = await updateQuoteItemColors({
        quoteItemId: 'item-123',
        quoteId: 'quote-123',
        colors: ['#FF5733', '#33FF57'],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.colors).toEqual(['#FF5733', '#33FF57']);
      }
      expect(revalidatePath).toHaveBeenCalledWith('/finances/quotes/quote-123');
    });

    it('validates hex color format', async () => {
      const result = await updateQuoteItemColors({
        quoteItemId: 'item-123',
        quoteId: 'quote-123',
        colors: ['invalid-color'],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid color format');
      }
    });

    it('validates maximum color limit', async () => {
      const result = await updateQuoteItemColors({
        quoteItemId: 'item-123',
        quoteId: 'quote-123',
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
      mockQuoteRepo.findById.mockResolvedValue({
        id: 'quote-123',
        quoteNumber: 'QUO-001',
      });
      mockQuoteRepo.createVersion.mockResolvedValue({
        id: 'quote-456',
        quoteNumber: 'QUO-001-v2',
        versionNumber: 2,
      });

      const result = await createQuoteVersion({ quoteId: 'quote-123' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('quote-456');
        expect(result.data.quoteNumber).toBe('QUO-001-v2');
        expect(result.data.versionNumber).toBe(2);
        expect(result.data.parentQuoteNumber).toBe('QUO-001');
      }
      expect(requirePermission).toHaveBeenCalledWith(mockSession.user, 'canManageQuotes');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/quotes');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/quotes/quote-123');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/quotes/quote-456');
    });

    it('returns error when parent quote not found', async () => {
      mockQuoteRepo.findById.mockResolvedValue(null);

      const result = await createQuoteVersion({ quoteId: 'non-existent' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Quote not found');
      }
    });
  });
});
