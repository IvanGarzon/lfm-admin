import { z } from 'zod';
import { QuoteStatusSchema } from '@/zod/schemas/enums/QuoteStatus.schema';
import { ALLOWED_IMAGE_MIME_TYPES, MAX_FILE_SIZE } from '@/lib/file-constants';
import { commonValidators, VALIDATION_LIMITS } from '@/lib/validation';
import { baseFiltersSchema, createEnumArrayFilter } from '@/schemas/common';

export const QuoteItemSchema = z.object({
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
  productId: z.string().nullable(),
  notes: z
    .string()
    .max(VALIDATION_LIMITS.DESCRIPTION_MAX, {
      error: `Notes must be less than ${VALIDATION_LIMITS.DESCRIPTION_MAX} characters`,
    })
    .optional(),
  colors: z
    .array(
      z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
        message: 'Color must be a valid hex code (e.g., #FF5733 or #F00)',
      }),
    )
    .max(10, { error: 'Maximum 10 colors allowed' }),
});

export const QuoteSchema = z
  .object({
    customerId: z.cuid({ error: 'Customer is required' }),
    status: QuoteStatusSchema,
    issuedDate: z.date({ error: 'Issued date is required' }),
    validUntil: z.date({ error: 'Valid until date is required' }),
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
    terms: z
      .string()
      .max(VALIDATION_LIMITS.TERMS_MAX, {
        error: `Terms must be less than ${VALIDATION_LIMITS.TERMS_MAX} characters`,
      })
      .optional(),
    items: z
      .array(QuoteItemSchema)
      .min(1, { error: 'At least one item is required' })
      .max(100, { error: 'Maximum 100 items allowed' }),
  })
  .refine((data) => data.validUntil >= data.issuedDate, {
    error: 'Valid until date must be on or after issued date',
    path: ['validUntil'],
  });

export const CreateQuoteSchema = QuoteSchema;
export const UpdateQuoteSchema = QuoteSchema.safeExtend({
  id: z.cuid({ error: 'Invalid quote ID' }),
});

/**
 * Mark Quote as Accepted Schema
 */
export const MarkQuoteAsAcceptedSchema = z.object({
  id: z.cuid({ error: 'Quote ID is required' }),
});

/**
 * Mark Quote as Rejected Schema
 */
export const MarkQuoteAsRejectedSchema = z.object({
  id: z.cuid({ error: 'Quote ID is required' }),
  rejectReason: z
    .string()
    .trim()
    .min(1, { error: 'Rejection reason is required' })
    .max(VALIDATION_LIMITS.REASON_MAX, {
      error: `Reason must be less than ${VALIDATION_LIMITS.REASON_MAX} characters`,
    }),
});

/**
 * Mark Quote as On Hold Schema
 */
export const MarkQuoteAsOnHoldSchema = z.object({
  id: z.cuid({ error: 'Quote ID is required' }),
  reason: z
    .string()
    .trim()
    .max(VALIDATION_LIMITS.REASON_MAX, {
      error: `Reason must be less than ${VALIDATION_LIMITS.REASON_MAX} characters`,
    })
    .optional(),
});

/**
 * Mark Quote as Cancelled Schema
 */
export const MarkQuoteAsCancelledSchema = z.object({
  id: z.cuid({ error: 'Quote ID is required' }),
  reason: z
    .string()
    .trim()
    .max(VALIDATION_LIMITS.REASON_MAX, {
      error: `Reason must be less than ${VALIDATION_LIMITS.REASON_MAX} characters`,
    })
    .optional(),
});

/**
 * Convert Quote to Invoice Schema
 */
export const ConvertQuoteToInvoiceSchema = z.object({
  id: z.cuid({ error: 'Quote ID is required' }),
  dueDate: z.date({ error: 'Due date is required' }),
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
});

/**
 * Quote Filters Schema
 */
export const QuoteFiltersSchema = baseFiltersSchema.extend({
  status: createEnumArrayFilter(QuoteStatusSchema),
});

/**
 * Quote Item Attachment Schemas
 */
export const QuoteItemAttachmentSchema = z.object({
  id: z.cuid({ error: 'Quote item attachment ID is required' }),
  quoteItemId: z.cuid({ error: 'Quote item ID is required' }),
  fileName: z.string().min(1, { error: 'File name is required' }),
  fileSize: z.number().int().positive({ error: 'File size must be positive' }),
  mimeType: z.string().min(1, { error: 'File type is required' }),
  s3Key: z.string().min(1, { error: 'S3 key is required' }),
  s3Url: z
    .string()
    .trim()
    .max(VALIDATION_LIMITS.URL_MAX)
    .pipe(z.url({ error: 'Invalid S3 URL' })),
  uploadedBy: z.string().nullable(),
  uploadedAt: z.date(),
});

/**
 * Upload Item Attachment Schema (for server-side validation)
 */
export const UploadItemAttachmentSchema = z.object({
  quoteItemId: z.cuid({ error: 'Quote item ID is required' }),
  fileName: z.string().min(1, { error: 'File name is required' }),
  fileSize: z
    .number()
    .int()
    .positive({ error: 'File size must be positive' })
    .max(MAX_FILE_SIZE, {
      error: `File size must not exceed ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }),
  mimeType: z.string().refine((type) => ALLOWED_IMAGE_MIME_TYPES.includes(type as any), {
    error: `File type must be an image: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}`,
  }),
});

/**
 * Delete Item Attachment Schema
 */
export const DeleteItemAttachmentSchema = z.object({
  attachmentId: z.cuid({ error: 'Attachment ID is required' }),
});

/**
 * Create Version Schema
 */
export const CreateVersionSchema = z.object({
  quoteId: z.cuid({ error: 'Quote ID is required' }),
});

/**
 * Send Quote Email Schema
 */
export const SendQuoteEmailSchema = z.object({
  quoteId: z.cuid({ error: 'Quote ID is required' }),
  to: commonValidators.email(),
  quoteData: z.object({
    quoteNumber: z.string({ error: 'Quote number is required' }),
    customerName: z.string({ error: 'Customer name is required' }),
    amount: z.number().positive({ error: 'Amount must be positive' }),
    currency: z.string({ error: 'Currency is required' }),
    issuedDate: z.coerce.date({ error: 'Issued date is required' }),
    validUntil: z.coerce.date({ error: 'Valid until date is required' }),
    itemCount: z.number().int().nonnegative({ error: 'Item count must be non-negative' }),
  }),
  pdfUrl: z.string().trim().max(VALIDATION_LIMITS.URL_MAX).pipe(z.url()).optional(),
});

/**
 * Type Inference
 */
export type CreateQuoteInput = z.infer<typeof CreateQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof UpdateQuoteSchema>;
export type MarkQuoteAsAcceptedInput = z.infer<typeof MarkQuoteAsAcceptedSchema>;
export type MarkQuoteAsRejectedInput = z.infer<typeof MarkQuoteAsRejectedSchema>;
export type MarkQuoteAsOnHoldInput = z.infer<typeof MarkQuoteAsOnHoldSchema>;
export type MarkQuoteAsCancelledInput = z.infer<typeof MarkQuoteAsCancelledSchema>;
export type ConvertQuoteToInvoiceInput = z.infer<typeof ConvertQuoteToInvoiceSchema>;
export type QuoteItemAttachmentInput = z.infer<typeof QuoteItemAttachmentSchema>;
export type UploadItemAttachmentInput = z.infer<typeof UploadItemAttachmentSchema>;
export type DeleteItemAttachmentInput = z.infer<typeof DeleteItemAttachmentSchema>;
export type CreateVersionInput = z.infer<typeof CreateVersionSchema>;
export type SendQuoteEmailInput = z.infer<typeof SendQuoteEmailSchema>;
