import { z } from 'zod';
import { TransactionStatusSchema } from '@/zod/inputTypeSchemas/TransactionStatusSchema';
import { TransactionTypeSchema } from '@/zod/inputTypeSchemas/TransactionTypeSchema';

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
  invoiceId: z.string().optional().nullable(),
});

export const CreateTransactionSchema = TransactionSchema;
export const UpdateTransactionSchema = TransactionSchema.safeExtend({
  id: z.string().min(1, { error: 'Invalid transaction ID' }),
});

/**
 * Transaction Filters Schema
 */
const sortingItemSchema = z.object({
  id: z.string(),
  desc: z.boolean(),
});

const sortingSchema = z.union([z.string(), z.array(z.unknown())]).transform((val) => {
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return z.array(sortingItemSchema).parse(parsed);
    } catch {
      return [];
    }
  }
  if (Array.isArray(val)) {
    return z.array(sortingItemSchema).parse(val);
  }
  return [];
});

export const TransactionFiltersSchema = z.object({
  search: z.string().trim().default('').optional(),
  type: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => {
      const arr = Array.isArray(val) ? val : val ? val.split(',').map((v) => v.trim()) : [];
      return arr.length === 0 ? undefined : arr.map((v) => TransactionTypeSchema.parse(v));
    })
    .optional(),
  status: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => {
      const arr = Array.isArray(val) ? val : val ? val.split(',').map((v) => v.trim()) : [];
      return arr.length === 0 ? undefined : arr.map((v) => TransactionStatusSchema.parse(v));
    })
    .optional(),
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
  sort: sortingSchema.default([]),
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;
