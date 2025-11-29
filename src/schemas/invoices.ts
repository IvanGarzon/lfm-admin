import { z } from 'zod';
import { InvoiceStatusSchema } from '@/zod/inputTypeSchemas/InvoiceStatusSchema';

export const InvoiceItemSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, { error: 'Description is required' })
    .max(500, { error: 'Description must be less than 500 characters' }),
  quantity: z
    .number()
    .int({ error: 'Quantity must be a whole number' })
    .positive({ error: 'Quantity must be positive' })
    .max(10000, { error: 'Quantity must be less than 10,000' }),
  unitPrice: z
    .number()
    .nonnegative({ error: 'Unit price must be non-negative' })
    .max(1000000, { error: 'Unit price must be less than 1,000,000' }),
  productId: z.string().nullable(),
  id: z.string().optional(),
});

export const InvoiceSchema = z
  .object({
    customerId: z.string().min(1, { error: 'Customer is required' }),
    status: InvoiceStatusSchema,
    issuedDate: z.date({ error: 'Issued date is required' }),
    dueDate: z.date({ error: 'Due date is required' }),
    currency: z.string().length(3, { error: 'Currency must be a 3-letter code' }),
    gst: z
      .number()
      .min(0, { error: 'GST percentage must be at least 0%' })
      .max(100, { error: 'GST percentage cannot exceed 100%' }),
    discount: z
      .number()
      .min(0, { error: 'Discount must be at least 0' })
      .max(1000000, { error: 'Discount must be less than 1,000,000' }),
    notes: z.string().max(1000, { error: 'Notes must be less than 1000 characters' }).optional(),
    items: z
      .array(InvoiceItemSchema)
      .min(1, { error: 'At least one item is required' })
      .max(100, { error: 'Maximum 100 items allowed' }),
  })
  .refine((data) => data.dueDate >= data.issuedDate, {
    error: 'Due date must be on or after issued date',
    path: ['dueDate'],
  });

export const CreateInvoiceSchema = InvoiceSchema;
export const UpdateInvoiceSchema = InvoiceSchema.safeExtend({
  id: z.string().min(1, { error: 'Invalid invoice ID' }),
});

/**
 * Mark Invoice as Paid Schema
 */
export const MarkInvoiceAsPaidSchema = z.object({
  id: z.string().min(1, { error: 'Invoice ID is required' }),
  paidDate: z.date(),
  paymentMethod: z
    .string()
    .trim()
    .min(1, { error: 'Payment method is required' })
    .max(100, { error: 'Payment method must be less than 100 characters' }),
});

/**
 * Mark Invoice as Pending Schema
 */
export const MarkInvoiceAsPendingSchema = z.object({
  id: z.string().min(1, { error: 'Invoice ID is required' }),
});

/**
 * Cancel Invoice Schema
 */
export const CancelInvoiceSchema = z.object({
  id: z.string().min(1, { error: 'Invoice ID is required' }),
  cancelledDate: z.date(),
  cancelReason: z
    .string()
    .trim()
    .min(1, { message: 'Cancellation reason is required' })
    .max(500, { message: 'Reason must be less than 500 characters' }),
});

/**
 * Type Inference
 */
export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>;
export type MarkInvoiceAsPaidInput = z.infer<typeof MarkInvoiceAsPaidSchema>;
export type MarkInvoiceAsPendingInput = z.infer<typeof MarkInvoiceAsPendingSchema>;
export type CancelInvoiceInput = z.infer<typeof CancelInvoiceSchema>;

/**
 * Invoice Filters Schema
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

export const InvoiceFiltersSchema = z.object({
  search: z.string().trim().default('').optional(),
  status: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => {
      const arr = Array.isArray(val) ? val : val ? val.split(',').map((v) => v.trim()) : [];
      return arr.length === 0 ? undefined : arr.map((v) => InvoiceStatusSchema.parse(v));
    })
    .optional(),
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
  sort: sortingSchema.default([]),
  // dateFrom: z.date().nullable().default(null),
  // dateTo: z.date().nullable().default(null),
  // minAmount: z.number().nullable().default(null),
  // maxAmount: z.number().nullable().default(null),
});
