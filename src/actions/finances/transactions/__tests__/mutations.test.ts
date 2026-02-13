import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  createTransactionCategory,
  uploadTransactionAttachment,
  deleteTransactionAttachment,
} from '../mutations';
import {
  testIds,
  mockSessions,
  createTransactionInput,
  createTransactionResponse,
  createTransactionWithDetails,
  createTransactionCategory as createCategoryFactory,
} from '@/lib/testing';

const { mockTransactionRepo, mockAuth, mockPrisma } = vi.hoisted(() => ({
  mockTransactionRepo: {
    createTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
    findById: vi.fn(),
  },
  mockAuth: vi.fn(),
  mockPrisma: {
    transactionCategory: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    transactionAttachment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/repositories/transaction-repository', () => {
  return {
    TransactionRepository: vi.fn().mockImplementation(function () {
      return mockTransactionRepo;
    }),
  };
});

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const TEST_TRANSACTION_ID = testIds.transaction();
const TEST_CATEGORY_ID = testIds.category();

describe('Transaction Mutations', () => {
  const mockSession = mockSessions.manager();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
  });

  describe('createTransaction', () => {
    it('creates a transaction successfully when authorized', async () => {
      const input = createTransactionInput();
      const mockResponse = createTransactionResponse();

      mockTransactionRepo.createTransaction.mockResolvedValue(mockResponse);

      const result = await createTransaction(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBeDefined();
      }
      expect(mockTransactionRepo.createTransaction).toHaveBeenCalled();
    });

    it('creates an income transaction', async () => {
      const input = createTransactionInput({ type: 'INCOME', amount: 500 });
      const mockResponse = createTransactionResponse({ type: 'INCOME', amount: 500 });

      mockTransactionRepo.createTransaction.mockResolvedValue(mockResponse);

      const result = await createTransaction(input);

      expect(result.success).toBe(true);
      expect(mockTransactionRepo.createTransaction).toHaveBeenCalled();
    });

    it('creates an expense transaction', async () => {
      const input = createTransactionInput({ type: 'EXPENSE', amount: 200 });
      const mockResponse = createTransactionResponse({ type: 'EXPENSE', amount: 200 });

      mockTransactionRepo.createTransaction.mockResolvedValue(mockResponse);

      const result = await createTransaction(input);

      expect(result.success).toBe(true);
      expect(mockTransactionRepo.createTransaction).toHaveBeenCalled();
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const input = createTransactionInput();
      const result = await createTransaction(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unauthorized');
      }
    });

    it('returns validation error for invalid input', async () => {
      const invalidInput = {
        ...createTransactionInput(),
        amount: -100, // Invalid: negative amount
      };

      const result = await createTransaction(invalidInput);

      expect(result.success).toBe(false);
    });
  });

  describe('updateTransaction', () => {
    it('updates a transaction successfully when authorized', async () => {
      const input = {
        id: TEST_TRANSACTION_ID,
        ...createTransactionInput(),
      };

      mockTransactionRepo.findById.mockResolvedValue(createTransactionWithDetails());
      mockTransactionRepo.updateTransaction.mockResolvedValue(
        createTransactionResponse({ id: TEST_TRANSACTION_ID }),
      );

      const result = await updateTransaction(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_TRANSACTION_ID);
      }
    });

    it('returns error when transaction not found', async () => {
      const input = {
        id: testIds.nonExistent(),
        ...createTransactionInput(),
      };

      mockTransactionRepo.findById.mockResolvedValue(null);

      const result = await updateTransaction(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Transaction not found');
      }
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const input = {
        id: TEST_TRANSACTION_ID,
        ...createTransactionInput(),
      };
      const result = await updateTransaction(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unauthorized');
      }
    });
  });

  describe('deleteTransaction', () => {
    it('deletes a transaction successfully when authorized', async () => {
      mockTransactionRepo.findById.mockResolvedValue(createTransactionWithDetails());
      mockTransactionRepo.deleteTransaction.mockResolvedValue(undefined);

      const result = await deleteTransaction(TEST_TRANSACTION_ID);

      expect(result.success).toBe(true);
      expect(mockTransactionRepo.deleteTransaction).toHaveBeenCalledWith(TEST_TRANSACTION_ID);
    });

    it('returns error when transaction not found', async () => {
      mockTransactionRepo.findById.mockResolvedValue(null);

      const result = await deleteTransaction('non-existent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Transaction not found');
      }
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await deleteTransaction(TEST_TRANSACTION_ID);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unauthorized');
      }
    });
  });

  describe('createTransactionCategory', () => {
    it('creates a new category successfully', async () => {
      mockPrisma.transactionCategory.findFirst.mockResolvedValue(null);
      mockPrisma.transactionCategory.create.mockResolvedValue(
        createCategoryFactory({ id: TEST_CATEGORY_ID, name: 'New Category' }),
      );

      const result = await createTransactionCategory('New Category');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('New Category');
      }
    });

    it('returns existing category if name already exists', async () => {
      const existingCategory = createCategoryFactory({
        id: TEST_CATEGORY_ID,
        name: 'Existing Category',
      });
      mockPrisma.transactionCategory.findFirst.mockResolvedValue(existingCategory);

      const result = await createTransactionCategory('Existing Category');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_CATEGORY_ID);
      }
      expect(mockPrisma.transactionCategory.create).not.toHaveBeenCalled();
    });

    it('returns validation error for empty name', async () => {
      const result = await createTransactionCategory('');

      expect(result.success).toBe(false);
    });

    it('returns validation error for name that is too long', async () => {
      const longName = 'a'.repeat(51); // Exceeds 50 character limit
      const result = await createTransactionCategory(longName);

      expect(result.success).toBe(false);
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await createTransactionCategory('Test Category');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unauthorized');
      }
    });
  });

  describe('uploadTransactionAttachment', () => {
    it('uploads attachment successfully', async () => {
      const mockFile = new File(['test content'], 'test.pdf', {
        type: 'application/pdf',
      });
      const formData = new FormData();
      formData.append('file', mockFile);

      const { uploadFileToS3 } = await import('@/lib/s3');
      vi.mocked(uploadFileToS3).mockResolvedValue({
        s3Key: 'test-key',
        s3Url: 'https://test.s3.amazonaws.com/test-key',
      });

      mockPrisma.transactionAttachment.create.mockResolvedValue({
        id: testIds.attachment(),
        fileName: 'test.pdf',
        fileSize: 12,
        mimeType: 'application/pdf',
        s3Url: 'https://test.s3.amazonaws.com/test-key',
      });

      const result = await uploadTransactionAttachment(TEST_TRANSACTION_ID, formData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fileName).toBe('test.pdf');
      }
    });

    it('returns error when no file provided', async () => {
      const formData = new FormData();

      const result = await uploadTransactionAttachment(TEST_TRANSACTION_ID, formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('No file provided');
      }
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const formData = new FormData();
      const result = await uploadTransactionAttachment(TEST_TRANSACTION_ID, formData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unauthorized');
      }
    });
  });

  describe('deleteTransactionAttachment', () => {
    const TEST_ATTACHMENT_ID = testIds.attachment();

    it('deletes attachment successfully', async () => {
      mockPrisma.transactionAttachment.findUnique.mockResolvedValue({
        s3Key: 'test-key',
        transactionId: TEST_TRANSACTION_ID,
        fileName: 'test.pdf',
      });

      const { deleteFileFromS3 } = await import('@/lib/s3');
      vi.mocked(deleteFileFromS3).mockResolvedValue(undefined);

      mockPrisma.transactionAttachment.delete.mockResolvedValue({});

      const result = await deleteTransactionAttachment(TEST_ATTACHMENT_ID);

      expect(result.success).toBe(true);
    });

    it('returns error when attachment not found', async () => {
      mockPrisma.transactionAttachment.findUnique.mockResolvedValue(null);

      const result = await deleteTransactionAttachment('non-existent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Attachment not found');
      }
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await deleteTransactionAttachment(TEST_ATTACHMENT_ID);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unauthorized');
      }
    });
  });
});

describe('Transaction Mutations - Permission Tests', () => {
  const mockUserRole = mockSessions.user();
  const mockManagerRole = mockSessions.manager();
  const mockAdminRole = mockSessions.admin();

  beforeEach(() => {
    vi.clearAllMocks();
    mockTransactionRepo.createTransaction.mockResolvedValue(createTransactionResponse());
    mockTransactionRepo.findById.mockResolvedValue(createTransactionWithDetails());
    mockTransactionRepo.updateTransaction.mockResolvedValue(createTransactionResponse());
  });

  describe('createTransaction', () => {
    it('should allow USER role to create transactions', async () => {
      mockAuth.mockResolvedValue(mockUserRole);
      const input = createTransactionInput();

      const result = await createTransaction(input);

      expect(result.success).toBe(true);
    });

    it('should allow MANAGER role to create transactions', async () => {
      mockAuth.mockResolvedValue(mockManagerRole);
      const input = createTransactionInput();

      const result = await createTransaction(input);

      expect(result.success).toBe(true);
    });

    it('should allow ADMIN role to create transactions', async () => {
      mockAuth.mockResolvedValue(mockAdminRole);
      const input = createTransactionInput();

      const result = await createTransaction(input);

      expect(result.success).toBe(true);
    });

    it('should deny unauthenticated users', async () => {
      mockAuth.mockResolvedValue(null);
      const input = createTransactionInput();

      const result = await createTransaction(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unauthorized');
      }
    });
  });

  describe('updateTransaction', () => {
    it('should allow USER role to update transactions', async () => {
      mockAuth.mockResolvedValue(mockUserRole);
      const input = {
        id: TEST_TRANSACTION_ID,
        ...createTransactionInput(),
      };

      const result = await updateTransaction(input);

      expect(result.success).toBe(true);
    });
  });

  describe('deleteTransaction', () => {
    it('should allow MANAGER role to delete transactions', async () => {
      mockAuth.mockResolvedValue(mockManagerRole);
      mockTransactionRepo.deleteTransaction.mockResolvedValue(undefined);

      const result = await deleteTransaction(TEST_TRANSACTION_ID);

      expect(result.success).toBe(true);
    });
  });
});
