import { describe, it, expect } from 'vitest';
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
  DeleteTransactionSchema,
} from '../transactions';
import { testIds } from '@/lib/testing';

const TEST_TRANSACTION_ID = testIds.transaction();

const validTransaction = {
  type: 'INCOME',
  date: new Date(),
  amount: 100,
  currency: 'AUD',
  description: 'Test transaction',
  payee: 'Test Payee',
  status: 'COMPLETED',
  referenceNumber: null,
  referenceId: null,
  invoiceId: null,
  vendorId: null,
  customerId: null,
};

describe('Transaction Schemas', () => {
  describe('CreateTransactionSchema', () => {
    it('validates a correct income transaction', () => {
      const result = CreateTransactionSchema.safeParse(validTransaction);
      expect(result.success).toBe(true);
    });

    it('validates a correct expense transaction', () => {
      const result = CreateTransactionSchema.safeParse({ ...validTransaction, type: 'EXPENSE' });
      expect(result.success).toBe(true);
    });

    it('validates with optional categoryIds', () => {
      const result = CreateTransactionSchema.safeParse({
        ...validTransaction,
        categoryIds: [testIds.category()],
      });
      expect(result.success).toBe(true);
    });

    it('fails when amount is zero', () => {
      const result = CreateTransactionSchema.safeParse({ ...validTransaction, amount: 0 });
      expect(result.success).toBe(false);
    });

    it('fails when amount is negative', () => {
      const result = CreateTransactionSchema.safeParse({ ...validTransaction, amount: -50 });
      expect(result.success).toBe(false);
    });

    it('fails when description is empty', () => {
      const result = CreateTransactionSchema.safeParse({ ...validTransaction, description: '' });
      expect(result.success).toBe(false);
    });

    it('fails when payee is empty', () => {
      const result = CreateTransactionSchema.safeParse({ ...validTransaction, payee: '' });
      expect(result.success).toBe(false);
    });

    it('fails when type is not a valid enum value', () => {
      const result = CreateTransactionSchema.safeParse({ ...validTransaction, type: 'TRANSFER' });
      expect(result.success).toBe(false);
    });

    it('fails when status is not a valid enum value', () => {
      const result = CreateTransactionSchema.safeParse({ ...validTransaction, status: 'DRAFT' });
      expect(result.success).toBe(false);
    });

    it('fails when referenceNumber exceeds 100 characters', () => {
      const result = CreateTransactionSchema.safeParse({
        ...validTransaction,
        referenceNumber: 'x'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('fails when invoiceId is not a valid CUID', () => {
      const result = CreateTransactionSchema.safeParse({
        ...validTransaction,
        invoiceId: 'not-a-cuid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateTransactionSchema', () => {
    it('validates a correct update payload with an ID', () => {
      const result = UpdateTransactionSchema.safeParse({
        ...validTransaction,
        id: TEST_TRANSACTION_ID,
      });
      expect(result.success).toBe(true);
    });

    it('fails when id is missing', () => {
      const result = UpdateTransactionSchema.safeParse(validTransaction);
      expect(result.success).toBe(false);
    });

    it('fails when id is not a valid CUID', () => {
      const result = UpdateTransactionSchema.safeParse({
        ...validTransaction,
        id: 'not-a-cuid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('DeleteTransactionSchema', () => {
    it('validates a correct delete payload', () => {
      const result = DeleteTransactionSchema.safeParse({ id: TEST_TRANSACTION_ID });
      expect(result.success).toBe(true);
    });

    it('fails when id is missing', () => {
      const result = DeleteTransactionSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('fails when id is not a valid CUID', () => {
      const result = DeleteTransactionSchema.safeParse({ id: 'not-valid' });
      expect(result.success).toBe(false);
    });
  });
});
