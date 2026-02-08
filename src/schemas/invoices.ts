import { z } from 'zod';
import { InvoiceStatusSchema } from '@/zod/schemas/enums/InvoiceStatus.schema';
import { commonValidators, VALIDATION_LIMITS } from '@/lib/validation';
import { baseFiltersSchema, createEnumArrayFilter } from '@/schemas/common';

export const InvoiceItemSchema = z.object({
  id: z.cuid().optional(),
  description: z
    .string()
    .trim()
    .min(1, { error: 'Description is required' })
    .max(VALIDATION_LIMITS.DESCRIPTION_MAX, {
      error: `Description must be less than ${VALIDATION_LIMITS.DESCRIPTION_MAX} characters`,
    }),
  quantity: z
    .number()
    .int({ error: 'Quantity must be a whole number' })
    .positive({ error: 'Quantity must be positive' })
    .max(10000, { error: 'Quantity must be less than 10,000' }),
  unitPrice: z
    .number()
    .nonnegative({ error: 'Unit price must be non-negative' })
    .max(1000000, { error: 'Unit price must be less than 1,000,000' }),
  productId: z.cuid().nullable(),
});

export const InvoiceSchema = z
  .object({
    customerId: z.cuid({ error: 'Customer ID is required' }),
    status: InvoiceStatusSchema,
    issuedDate: z.date({ error: 'Issued date is required' }),
    dueDate: z.date({ error: 'Due date is required' }),
    currency: z.string().length(3, { error: 'Currency must be a 3-letter code' }),
    gst: z
      .number()
      .min(VALIDATION_LIMITS.GST_MIN, {
        error: `GST percentage must be at least ${VALIDATION_LIMITS.GST_MIN}%`,
      })
      .max(VALIDATION_LIMITS.GST_MAX, {
        error: `GST percentage cannot exceed ${VALIDATION_LIMITS.GST_MAX}%`,
      }),
    discount: z
      .number()
      .min(0, { error: 'Discount must be at least 0' })
      .max(1000000, { error: 'Discount must be less than 1,000,000' }),
    notes: z
      .string()
      .max(VALIDATION_LIMITS.NOTES_MAX, {
        error: `Notes must be less than ${VALIDATION_LIMITS.NOTES_MAX} characters`,
      })
      .optional(),
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
  id: z.cuid({ error: 'Invalid invoice ID' }),
});

/**
 * Record Payment Schema
 */
export const RecordPaymentSchema = z.object({
  id: z.cuid({ error: 'Invalid payment ID' }),
  amount: z.number().positive(),
  paidDate: z.date(),
  paymentMethod: z
    .string()
    .trim()
    .min(1, { error: 'Payment method is required' })
    .max(100, { error: 'Payment method must be less than 100 characters' }),
  notes: z
    .string()
    .max(VALIDATION_LIMITS.DESCRIPTION_MAX, {
      error: `Notes must be less than ${VALIDATION_LIMITS.DESCRIPTION_MAX} characters`,
    })
    .optional(),
});

/**
 * Mark Invoice as Pending Schema
 */
export const MarkInvoiceAsPendingSchema = z.object({
  id: z.cuid({ error: 'Invoice ID is required' }),
});

/**
 * Cancel Invoice Schema
 */
export const CancelInvoiceSchema = z.object({
  id: z.cuid({ error: 'Invoice ID is required' }),
  cancelledDate: z.date(),
  cancelReason: z
    .string()
    .trim()
    .min(1, { error: 'Cancellation reason is required' })
    .max(VALIDATION_LIMITS.REASON_MAX, {
      error: `Reason must be less than ${VALIDATION_LIMITS.REASON_MAX} characters`,
    }),
});

export const InvoiceFiltersSchema = baseFiltersSchema.extend({
  status: createEnumArrayFilter(InvoiceStatusSchema),
});

export const SendInvoiceEmailSchema = z.object({
  invoiceId: z.cuid({ error: 'Invalid invoice ID' }),
  to: commonValidators.email(),
  invoiceData: z.object({
    invoiceNumber: z.string({ error: 'Invoice number is required' }),
    customerName: z.string({ error: 'Customer name is required' }),
    amount: z.number().positive({ error: 'Amount must be positive' }),
    currency: z.string({ error: 'Currency is required' }),
    dueDate: z.coerce.date({ error: 'Due date is required' }),
    issuedDate: z.coerce.date({ error: 'Issued date is required' }),
  }),
  pdfUrl: z.string().trim().max(VALIDATION_LIMITS.URL_MAX).pipe(z.url()).optional(),
});

export const SendReminderEmailSchema = z.object({
  invoiceId: z.cuid({ error: 'Invalid invoice ID' }),
  to: commonValidators.email(),
  reminderData: z.object({
    invoiceNumber: z.string({ error: 'Invoice number is required' }),
    customerName: z.string({ error: 'Customer name is required' }),
    amount: z.number().positive({ error: 'Amount must be positive' }),
    currency: z.string({ error: 'Currency is required' }),
    dueDate: z.coerce.date({ error: 'Due date is required' }),
    daysOverdue: z.number().int().positive({ error: 'Days overdue must be positive' }),
    amountPaid: z.number().nonnegative().optional(),
    amountDue: z.number().nonnegative().optional(),
  }),
  pdfUrl: z.string().trim().max(VALIDATION_LIMITS.URL_MAX).pipe(z.url()).optional(),
});

export const SendReceiptEmailSchema = z.object({
  invoiceId: z.cuid({ error: 'Invalid invoice ID' }),
  to: commonValidators.email(),
  receiptData: z.object({
    invoiceNumber: z.string({ error: 'Invoice number is required' }),
    receiptNumber: z.string().optional(),
    customerName: z.string({ error: 'Customer name is required' }),
    amount: z.number().positive({ error: 'Amount must be positive' }),
    currency: z.string({ error: 'Currency is required' }),
    paidDate: z.coerce.date({ error: 'Paid date is required' }),
    paymentMethod: z.string({ error: 'Payment method is required' }),
  }),
  pdfUrl: z.string().trim().max(VALIDATION_LIMITS.URL_MAX).pipe(z.url()).optional(),
});

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>;
export type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>;
export type MarkInvoiceAsPendingInput = z.infer<typeof MarkInvoiceAsPendingSchema>;
export type CancelInvoiceInput = z.infer<typeof CancelInvoiceSchema>;
export type SendInvoiceEmailInput = z.infer<typeof SendInvoiceEmailSchema>;
export type SendReminderEmailInput = z.infer<typeof SendReminderEmailSchema>;
export type SendReceiptEmailInput = z.infer<typeof SendReceiptEmailSchema>;
