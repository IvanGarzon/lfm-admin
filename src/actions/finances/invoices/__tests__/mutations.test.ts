/**
 * Invoice Mutation Action Tests
 *
 * PURPOSE: Tests the action layer for all invoice write operations (mutations).
 * These tests verify that server actions correctly handle authentication,
 * authorization, validation, and delegate to the repository.
 *
 * SCOPE:
 * - Authentication checks (session validation, unauthorized responses)
 * - Permission enforcement (role-based access control)
 * - Input validation (schema validation via Zod)
 * - Proper delegation to InvoiceRepository methods
 * - Cache invalidation (revalidatePath calls)
 * - Error handling and ActionResult responses
 *
 * MOCKING STRATEGY:
 * - InvoiceRepository is mocked to isolate action logic from database
 * - Auth module is mocked to simulate different user sessions/roles
 * - Permissions are mocked to test RBAC enforcement
 * - next/cache is mocked to verify revalidation calls
 *
 * TEST SECTIONS:
 * 1. Basic CRUD operations (create, update, delete)
 * 2. Status transitions (pending, draft, cancel)
 * 3. Payment recording
 * 4. Bulk operations
 * 5. Email operations (receipt, reminder)
 * 6. Permission tests per role (USER, MANAGER, ADMIN)
 *
 * WHY SEPARATE FROM REPOSITORY TESTS:
 * - Repository tests focus on database query correctness
 * - Action tests focus on authentication, permissions, and HTTP layer concerns
 * - This separation ensures both layers are tested independently
 *
 * @see src/repositories/invoice-repository.spec.ts for repository layer tests
 * @see src/actions/finances/invoices/__tests__/queries.test.ts for read operations
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createInvoice,
  updateInvoice,
  markInvoiceAsPending,
  markInvoiceAsDraft,
  recordPayment,
  cancelInvoice,
  deleteInvoice,
  duplicateInvoice,
  bulkUpdateInvoiceStatus,
  sendInvoiceReceipt,
  sendInvoiceReminder,
} from '../mutations';
import { revalidatePath } from 'next/cache';
import { InvoiceStatus } from '@/prisma/client';
import {
  testIds,
  resetIdCounter,
  mockSessions,
  createInvoiceInput,
  createInvoiceItemInput,
  createInvoiceResponse,
  createInvoiceWithCustomer,
  createInvoiceDetails,
  createRecordPaymentInput,
  createCancelInvoiceInput,
} from '@/lib/testing';

const { mockInvoiceRepo, mockAuth, mockRequirePermission, mockPrisma } = vi.hoisted(() => ({
  mockInvoiceRepo: {
    createInvoiceWithItems: vi.fn(),
    updateInvoiceWithItems: vi.fn(),
    findById: vi.fn(),
    findByIdWithDetails: vi.fn(),
    markAsPending: vi.fn(),
    markAsDraft: vi.fn(),
    addPayment: vi.fn(),
    cancel: vi.fn(),
    softDelete: vi.fn(),
    duplicate: vi.fn(),
    bulkUpdateStatus: vi.fn(),
    generateReceiptNumber: vi.fn(),
    incrementReminderCount: vi.fn(),
  },
  mockAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockPrisma: {
    invoice: {
      update: vi.fn(),
    },
    emailAudit: {
      findFirst: vi.fn(),
    },
  },
}));

// Mock InvoiceRepository
vi.mock('@/repositories/invoice-repository', () => ({
  InvoiceRepository: vi.fn().mockImplementation(function () {
    return mockInvoiceRepo;
  }),
}));

// Mock TransactionRepository
vi.mock('@/repositories/transaction-repository', () => ({
  TransactionRepository: vi.fn().mockImplementation(function () {
    return {};
  }),
}));

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/permissions', () => ({
  requirePermission: mockRequirePermission,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

// Generate test IDs using the centralized ID generator
const TEST_CUSTOMER_ID = testIds.customer();
const TEST_INVOICE_ID = testIds.invoice();
const TEST_NON_EXISTENT_ID = testIds.nonExistent();

describe('Invoice Mutations', () => {
  const mockSession = mockSessions.manager();

  beforeEach(() => {
    vi.clearAllMocks();
    resetIdCounter();
    mockAuth.mockResolvedValue(mockSession);
  });

  describe('createInvoice', () => {
    const validData = createInvoiceInput({ customerId: TEST_CUSTOMER_ID });

    it('creates an invoice successfully when authorized', async () => {
      mockInvoiceRepo.createInvoiceWithItems.mockResolvedValue(
        createInvoiceResponse({ id: TEST_INVOICE_ID, invoiceNumber: 'INV-001' }),
      );

      const result = await createInvoice(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_INVOICE_ID);
        expect(result.data.invoiceNumber).toBe('INV-001');
      }
      expect(mockRequirePermission).toHaveBeenCalledWith(mockSession.user, 'canManageInvoices');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/invoices');
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await createInvoice(validData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unauthorized');
      }
    });
  });

  describe('updateInvoice', () => {
    const updateData = {
      id: TEST_INVOICE_ID,
      ...createInvoiceInput({
        customerId: TEST_CUSTOMER_ID,
        items: [
          createInvoiceItemInput({
            description: 'Updated Item',
            quantity: 2,
            unitPrice: 150,
          }),
        ],
      }),
    };

    it('updates an invoice successfully when authorized', async () => {
      mockInvoiceRepo.findById.mockResolvedValue({ id: TEST_INVOICE_ID });
      mockInvoiceRepo.updateInvoiceWithItems.mockResolvedValue({
        id: TEST_INVOICE_ID,
      });

      const result = await updateInvoice(updateData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_INVOICE_ID);
      }
      expect(mockRequirePermission).toHaveBeenCalledWith(mockSession.user, 'canManageInvoices');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/invoices');
      expect(revalidatePath).toHaveBeenCalledWith(`/finances/invoices/${TEST_INVOICE_ID}`);
    });

    it('returns error when invoice not found', async () => {
      mockInvoiceRepo.findById.mockResolvedValue(null);

      const result = await updateInvoice(updateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invoice not found');
      }
    });

    it('returns error when update fails', async () => {
      mockInvoiceRepo.findById.mockResolvedValue({ id: TEST_INVOICE_ID });
      mockInvoiceRepo.updateInvoiceWithItems.mockResolvedValue(null);

      const result = await updateInvoice(updateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Failed to update invoice');
      }
    });
  });

  describe('markInvoiceAsPending', () => {
    it('marks an invoice as pending successfully', async () => {
      mockInvoiceRepo.markAsPending.mockResolvedValue(
        createInvoiceWithCustomer({ id: TEST_INVOICE_ID, status: 'PENDING' }),
      );

      const result = await markInvoiceAsPending({ id: TEST_INVOICE_ID });

      expect(result.success).toBe(true);
      expect(mockRequirePermission).toHaveBeenCalledWith(mockSession.user, 'canManageInvoices');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/invoices');
      expect(revalidatePath).toHaveBeenCalledWith(`/finances/invoices/${TEST_INVOICE_ID}`);
    });

    it('returns error when invoice not found', async () => {
      mockInvoiceRepo.markAsPending.mockResolvedValue(null);

      const result = await markInvoiceAsPending({ id: TEST_NON_EXISTENT_ID });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invoice not found');
      }
    });
  });

  describe('markInvoiceAsDraft', () => {
    it('marks an invoice as draft successfully', async () => {
      mockInvoiceRepo.markAsDraft.mockResolvedValue({ id: TEST_INVOICE_ID });

      const result = await markInvoiceAsDraft(TEST_INVOICE_ID);

      expect(result.success).toBe(true);
      expect(mockRequirePermission).toHaveBeenCalledWith(mockSession.user, 'canManageInvoices');
    });

    it('returns error when invoice not found', async () => {
      mockInvoiceRepo.markAsDraft.mockResolvedValue(null);

      const result = await markInvoiceAsDraft(TEST_NON_EXISTENT_ID);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invoice not found');
      }
    });
  });

  describe('recordPayment', () => {
    it('records a payment successfully', async () => {
      const paymentData = createRecordPaymentInput({ id: TEST_INVOICE_ID });
      mockInvoiceRepo.addPayment.mockResolvedValue({
        id: TEST_INVOICE_ID,
        status: 'PAID',
        receiptNumber: 'REC-001',
      });

      const result = await recordPayment(paymentData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('PAID');
        expect(result.data.receiptNumber).toBe('REC-001');
      }
      expect(mockRequirePermission).toHaveBeenCalledWith(mockSession.user, 'canRecordPayments');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/invoices');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/transactions');
    });

    it('returns error when invoice not found', async () => {
      const paymentData = createRecordPaymentInput({ id: TEST_NON_EXISTENT_ID });
      mockInvoiceRepo.addPayment.mockResolvedValue(null);

      const result = await recordPayment(paymentData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invoice not found');
      }
    });
  });

  describe('cancelInvoice', () => {
    it('cancels an invoice successfully', async () => {
      const cancelData = createCancelInvoiceInput({ id: TEST_INVOICE_ID });
      mockInvoiceRepo.cancel.mockResolvedValue({
        id: TEST_INVOICE_ID,
        status: 'CANCELLED',
      });

      const result = await cancelInvoice(cancelData);

      expect(result.success).toBe(true);
      expect(mockRequirePermission).toHaveBeenCalledWith(mockSession.user, 'canManageInvoices');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/invoices');
    });

    it('returns error when invoice not found', async () => {
      const cancelData = createCancelInvoiceInput({ id: TEST_NON_EXISTENT_ID });
      mockInvoiceRepo.cancel.mockResolvedValue(null);

      const result = await cancelInvoice(cancelData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invoice not found');
      }
    });
  });

  describe('deleteInvoice', () => {
    it('soft deletes an invoice successfully', async () => {
      mockInvoiceRepo.softDelete.mockResolvedValue(true);

      const result = await deleteInvoice(TEST_INVOICE_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_INVOICE_ID);
      }
      expect(mockRequirePermission).toHaveBeenCalledWith(mockSession.user, 'canManageInvoices');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/invoices');
    });

    it('returns error when invoice not found', async () => {
      mockInvoiceRepo.softDelete.mockResolvedValue(false);

      const result = await deleteInvoice(TEST_NON_EXISTENT_ID);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invoice not found');
      }
    });
  });

  describe('duplicateInvoice', () => {
    it('duplicates an invoice successfully', async () => {
      mockInvoiceRepo.duplicate.mockResolvedValue({
        id: 'new-invoice-id',
        invoiceNumber: 'INV-002',
      });

      const result = await duplicateInvoice(TEST_INVOICE_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('new-invoice-id');
        expect(result.data.invoiceNumber).toBe('INV-002');
      }
      expect(revalidatePath).toHaveBeenCalledWith('/finances/invoices');
    });

    it('handles repository errors', async () => {
      mockInvoiceRepo.duplicate.mockRejectedValue(new Error('DB Error'));

      const result = await duplicateInvoice(TEST_INVOICE_ID);

      expect(result.success).toBe(false);
    });
  });

  describe('bulkUpdateInvoiceStatus', () => {
    it('should require authentication', async () => {
      mockAuth.mockResolvedValueOnce(null);
      const result = await bulkUpdateInvoiceStatus(['id-1'], 'PENDING' as InvoiceStatus);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unauthorized');
      }
    });

    it('should call repository bulkUpdateStatus', async () => {
      mockInvoiceRepo.bulkUpdateStatus.mockResolvedValue([
        { id: 'id-1', success: true },
        { id: 'id-2', success: true },
      ]);

      const result = await bulkUpdateInvoiceStatus(['id-1', 'id-2'], 'PENDING' as InvoiceStatus);

      expect(mockInvoiceRepo.bulkUpdateStatus).toHaveBeenCalledWith(
        ['id-1', 'id-2'],
        'PENDING',
        mockSession.user.id,
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.successCount).toBe(2);
        expect(result.data.failureCount).toBe(0);
      }
    });

    it('should handle partial failures', async () => {
      mockInvoiceRepo.bulkUpdateStatus.mockResolvedValue([
        { id: 'id-1', success: true },
        { id: 'id-2', success: false, error: 'Failed' },
      ]);

      const result = await bulkUpdateInvoiceStatus(['id-1', 'id-2'], 'PENDING' as InvoiceStatus);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.successCount).toBe(1);
        expect(result.data.failureCount).toBe(1);
      }
    });
  });

  describe('sendInvoiceReceipt', () => {
    it('sends receipt for paid invoice', async () => {
      mockInvoiceRepo.findByIdWithDetails.mockResolvedValue(
        createInvoiceDetails({ id: TEST_INVOICE_ID, status: 'PAID', receiptNumber: 'REC-001' }),
      );

      const result = await sendInvoiceReceipt(TEST_INVOICE_ID);

      expect(result.success).toBe(true);
    });

    it('returns error when invoice not found', async () => {
      mockInvoiceRepo.findByIdWithDetails.mockResolvedValue(null);

      const result = await sendInvoiceReceipt(TEST_NON_EXISTENT_ID);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invoice not found');
      }
    });

    it('returns error when invoice is not paid', async () => {
      mockInvoiceRepo.findByIdWithDetails.mockResolvedValue(
        createInvoiceDetails({ id: TEST_INVOICE_ID, status: 'PENDING' }),
      );

      const result = await sendInvoiceReceipt(TEST_INVOICE_ID);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invoice must be marked as paid before sending receipt');
      }
    });
  });

  describe('sendInvoiceReminder', () => {
    it('returns error when invoice is not overdue', async () => {
      mockInvoiceRepo.findByIdWithDetails.mockResolvedValue(
        createInvoiceDetails({
          id: TEST_INVOICE_ID,
          status: 'PENDING',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in future
        }),
      );

      const result = await sendInvoiceReminder(TEST_INVOICE_ID);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Cannot send reminder for invoice that is not overdue');
      }
    });

    it('returns error when invoice not found', async () => {
      mockInvoiceRepo.findByIdWithDetails.mockResolvedValue(null);

      const result = await sendInvoiceReminder(TEST_NON_EXISTENT_ID);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invoice not found');
      }
    });
  });
});

describe('Invoice Mutations - Permission Tests', () => {
  const mockUserRole = mockSessions.user();
  const mockManagerRole = mockSessions.manager();
  const mockAdminRole = mockSessions.admin();

  const setupPermissionMock = () => {
    mockRequirePermission.mockImplementation((user, permission) => {
      if (
        (permission === 'canManageInvoices' || permission === 'canRecordPayments') &&
        user?.role === 'USER'
      ) {
        throw new Error('Unauthorized: User does not have permission');
      }
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createInvoice', () => {
    const validData = createInvoiceInput({ customerId: TEST_CUSTOMER_ID });

    it('should DENY USER role from creating invoices', async () => {
      mockAuth.mockResolvedValue(mockUserRole);
      setupPermissionMock();

      const result = await createInvoice(validData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Unauthorized');
      }
    });

    it('should ALLOW MANAGER role to create invoices', async () => {
      mockAuth.mockResolvedValue(mockManagerRole);
      mockInvoiceRepo.createInvoiceWithItems.mockResolvedValue(createInvoiceResponse());

      const result = await createInvoice(validData);

      expect(result.success).toBe(true);
    });

    it('should ALLOW ADMIN role to create invoices', async () => {
      mockAuth.mockResolvedValue(mockAdminRole);
      mockInvoiceRepo.createInvoiceWithItems.mockResolvedValue(createInvoiceResponse());

      const result = await createInvoice(validData);

      expect(result.success).toBe(true);
    });
  });

  describe('recordPayment', () => {
    it('should DENY USER role from recording payments', async () => {
      mockAuth.mockResolvedValue(mockUserRole);
      setupPermissionMock();

      const result = await recordPayment(createRecordPaymentInput({ id: TEST_INVOICE_ID }));

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Unauthorized');
      }
    });

    it('should ALLOW MANAGER role to record payments', async () => {
      mockAuth.mockResolvedValue(mockManagerRole);
      mockInvoiceRepo.addPayment.mockResolvedValue({
        id: TEST_INVOICE_ID,
        status: 'PAID',
      });

      const result = await recordPayment(createRecordPaymentInput({ id: TEST_INVOICE_ID }));

      expect(result.success).toBe(true);
    });
  });

  describe('deleteInvoice', () => {
    it('should DENY USER role from deleting invoices', async () => {
      mockAuth.mockResolvedValue(mockUserRole);
      setupPermissionMock();

      const result = await deleteInvoice(TEST_INVOICE_ID);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Unauthorized');
      }
    });

    it('should ALLOW ADMIN role to delete invoices', async () => {
      mockAuth.mockResolvedValue(mockAdminRole);
      mockInvoiceRepo.softDelete.mockResolvedValue(true);

      const result = await deleteInvoice(TEST_INVOICE_ID);

      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing user session', async () => {
      mockAuth.mockResolvedValue(mockSessions.invalidSession());

      const result = await createInvoice(createInvoiceInput({ customerId: TEST_CUSTOMER_ID }));

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unauthorized');
      }
    });
  });
});
