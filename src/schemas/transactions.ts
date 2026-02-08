import { z } from 'zod';
import { TransactionStatusSchema } from '@/zod/schemas/enums/TransactionStatus.schema';
import { TransactionTypeSchema } from '@/zod/schemas/enums/TransactionType.schema';
import { VALIDATION_LIMITS } from '@/lib/validation';
import { baseFiltersSchema, createEnumArrayFilter } from '@/schemas/common';

export const TransactionSchema = z.object({
  type: TransactionTypeSchema,
  date: z.date(),
  amount: z.number().positive('Amount must be greater than 0'),
  currency: z.string(),
  categoryIds: z.array(z.string()).min(1, 'At least one category is required').optional(),
  description: z.string().min(1, 'Description is required'),
  payee: z.string().min(1, 'Payee is required'),
  status: TransactionStatusSchema,
  referenceNumber: z.string().optional().nullable(),
  referenceId: z.string().optional().nullable(),
  invoiceId: z.cuid().optional().nullable(),
});

export const CreateTransactionSchema = TransactionSchema;
export const UpdateTransactionSchema = TransactionSchema.safeExtend({
  id: z.cuid({ error: 'Invalid transaction ID' }),
});

/**
 * Transaction Filters Schema
 */
export const TransactionFiltersSchema = baseFiltersSchema.extend({
  type: createEnumArrayFilter(TransactionTypeSchema),
  status: createEnumArrayFilter(TransactionStatusSchema),
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;
