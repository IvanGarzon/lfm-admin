import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createInvoice, 
  updateInvoice,
  markInvoiceAsPending,
  deleteInvoice,
  recordPayment,
  cancelInvoice
} from './mutations';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/permissions';
import { InvoiceRepository } from '@/repositories/invoice-repository';
import { InvoiceStatus } from '@/prisma/client';

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/services/email-queue.service', () => ({
  queueInvoiceEmail: vi.fn().mockResolvedValue({}),
}));

const { mockRepoInstance } = vi.hoisted(() => ({
  mockRepoInstance: {
    createInvoiceWithItems: vi.fn(),
    updateInvoiceWithItems: vi.fn(),
    markAsPending: vi.fn(),
    softDelete: vi.fn(),
    markAsDraft: vi.fn(),
    addPayment: vi.fn(),
    cancel: vi.fn(),
  }
}));

// Mock InvoiceRepository
vi.mock('@/repositories/invoice-repository', () => {
  return {
    InvoiceRepository: vi.fn().mockImplementation(function() {
      return mockRepoInstance;
    }),
  };
});

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/permissions', () => ({
  requirePermission: vi.fn(),
}));

describe('Invoice mutations', () => {
  const mockSession = { user: { id: 'user_123', email: 'test@example.com', role: 'ADMIN' } };

  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue(mockSession);
  });

  describe('createInvoice', () => {
    const validData = {
      customerId: 'clv123456000008l28z3z4x5d',
      status: 'DRAFT' as any,
      issuedDate: new Date(),
      dueDate: new Date(),
      currency: 'AUD',
      gst: 10,
      discount: 0,
      items: [
        { description: 'Item 1', quantity: 1, unitPrice: 100, productId: null }
      ]
    };

    it('creates an invoice successfully when authorized', async () => {
      mockRepoInstance.createInvoiceWithItems.mockResolvedValue({ id: 'clv123456000008l28z3z4x5c', invoiceNumber: 'INV-001' });
      
      const result = await createInvoice(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.id).toBe('clv123456000008l28z3z4x5c');
      }
      expect(requirePermission).toHaveBeenCalledWith(mockSession.user, 'canManageInvoices');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/invoices');
    });

    it('returns unauthorized when no session', async () => {
      (auth as any).mockResolvedValue(null);
      const result = await createInvoice(validData);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });
  });

  describe('markInvoiceAsPending', () => {
    it('marks an invoice as pending successfully', async () => {
      const mockInvoice = {
        id: 'clv123456000008l28z3z4x5c',
        invoiceNumber: 'INV-001',
        status: 'PENDING',
        amount: 100,
        currency: 'AUD',
        dueDate: new Date(),
        issuedDate: new Date(),
        customer: {
          id: 'clv123456000008l28z3z4x5d',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        }
      };
      mockRepoInstance.markAsPending.mockResolvedValue(mockInvoice);

      const result = await markInvoiceAsPending({ id: 'clv123456000008l28z3z4x5c' });

      expect(result.success).toBe(true);
      expect(requirePermission).toHaveBeenCalledWith(mockSession.user, 'canManageInvoices');
    });
  });

  describe('recordPayment', () => {
    it('records a payment successfully', async () => {
      const paymentData = {
        id: 'clv123456000008l28z3z4x5c',
        amount: 50,
        paidDate: new Date(),
        paymentMethod: 'Credit Card'
      };
      mockRepoInstance.addPayment.mockResolvedValue({ id: 'clv123456000008l28z3z4x5c', status: 'PAID' });

      const result = await recordPayment(paymentData);

      expect(result.success).toBe(true);
      expect(requirePermission).toHaveBeenCalledWith(mockSession.user, 'canRecordPayments');
    });
  });

  describe('cancelInvoice', () => {
    it('cancels an invoice successfully', async () => {
      const cancelData = {
        id: 'clv123456000008l28z3z4x5c',
        cancelledDate: new Date(),
        cancelReason: 'Mistake'
      };
      mockRepoInstance.cancel.mockResolvedValue({ id: 'clv123456000008l28z3z4x5c', status: 'CANCELLED' });

      const result = await cancelInvoice(cancelData);

      expect(result.success).toBe(true);
      expect(requirePermission).toHaveBeenCalledWith(mockSession.user, 'canManageInvoices');
    });
  });

  describe('deleteInvoice', () => {
    it('soft deletes a draft invoice', async () => {
      mockRepoInstance.softDelete.mockResolvedValue(true);

      const result = await deleteInvoice('clv123456000008l28z3z4x5c');

      expect(result.success).toBe(true);
      expect(requirePermission).toHaveBeenCalledWith(mockSession.user, 'canManageInvoices');
    });
  });
});
