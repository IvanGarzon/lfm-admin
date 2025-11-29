import { z } from 'zod';
import { QuoteStatusSchema } from '@/zod/inputTypeSchemas/QuoteStatusSchema';
import { ALLOWED_MIME_TYPES, ALLOWED_IMAGE_MIME_TYPES, MAX_FILE_SIZE } from '@/lib/s3';

export const QuoteItemSchema = z.object({
  id: z.string().optional(),
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
  notes: z.string().max(500, { error: 'Notes must be less than 500 characters' }).optional(),
  colors: z
    .array(
      z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
        message: 'Color must be a valid hex code (e.g., #FF5733 or #F00)',
      })
    )
    .max(10, { error: 'Maximum 10 colors allowed' }),
});

export const QuoteSchema = z
  .object({
    customerId: z.string().min(1, { error: 'Customer is required' }),
    status: QuoteStatusSchema,
    issuedDate: z.date({ error: 'Issued date is required' }),
    validUntil: z.date({ error: 'Valid until date is required' }),
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
    terms: z.string().max(2000, { error: 'Terms must be less than 2000 characters' }).optional(),
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
  id: z.string().min(1, { error: 'Invalid quote ID' }),
});

/**
 * Mark Quote as Accepted Schema
 */
export const MarkQuoteAsAcceptedSchema = z.object({
  id: z.string().min(1, { error: 'Quote ID is required' }),
});

/**
 * Mark Quote as Rejected Schema
 */
export const MarkQuoteAsRejectedSchema = z.object({
  id: z.string().min(1, { error: 'Quote ID is required' }),
  rejectReason: z
    .string()
    .trim()
    .min(1, { error: 'Rejection reason is required' })
    .max(500, { error: 'Reason must be less than 500 characters' }),
});

/**
 * Mark Quote as On Hold Schema
 */
export const MarkQuoteAsOnHoldSchema = z.object({
  id: z.string().min(1, { error: 'Quote ID is required' }),
  reason: z.string().trim().max(500, { error: 'Reason must be less than 500 characters' }).optional(),
});

/**
 * Mark Quote as Cancelled Schema
 */
export const MarkQuoteAsCancelledSchema = z.object({
  id: z.string().min(1, { error: 'Quote ID is required' }),
  reason: z.string().trim().max(500, { error: 'Reason must be less than 500 characters' }).optional(),
});

/**
 * Convert Quote to Invoice Schema
 */
export const ConvertQuoteToInvoiceSchema = z.object({
  id: z.string().min(1, { error: 'Quote ID is required' }),
  dueDate: z.date({ error: 'Due date is required' }),
  gst: z
    .number()
    .min(0, { error: 'GST percentage must be at least 0%' })
    .max(100, { error: 'GST percentage cannot exceed 100%' }),
  discount: z
    .number()
    .min(0, { error: 'Discount must be at least 0' })
    .max(1000000, { error: 'Discount must be less than 1,000,000' }),
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

/**
 * Quote Filters Schema
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

export const QuoteFiltersSchema = z.object({
  search: z.string().trim().default('').optional(),
  status: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => {
      const arr = Array.isArray(val) ? val : val ? val.split(',').map((v) => v.trim()) : [];
      return arr.length === 0 ? undefined : arr.map((v) => QuoteStatusSchema.parse(v));
    })
    .optional(),
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
  sort: sortingSchema.default([]),
});

/**
 * Quote Attachment Schemas
 */
export const QuoteAttachmentSchema = z.object({
  id: z.string(),
  quoteId: z.string(),
  fileName: z.string(),
  fileSize: z.number().int().positive(),
  mimeType: z.string(),
  s3Key: z.string(),
  s3Url: z.string().url(),
  uploadedBy: z.string().nullable(),
  uploadedAt: z.date(),
});

/**
 * Upload Attachment Schema (for server-side validation)
 */
export const UploadAttachmentSchema = z.object({
  quoteId: z.string().min(1, { error: 'Quote ID is required' }),
  fileName: z.string().min(1, { error: 'File name is required' }),
  fileSize: z
    .number()
    .int()
    .positive({ error: 'File size must be positive' })
    .max(MAX_FILE_SIZE, {
      error: `File size must not exceed ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }),
  mimeType: z.string().refine((type) => ALLOWED_MIME_TYPES.includes(type as any), {
    error: `File type must be one of: ${ALLOWED_MIME_TYPES.join(', ')}`,
  }),
});

/**
 * Delete Attachment Schema
 */
export const DeleteAttachmentSchema = z.object({
  attachmentId: z.string().min(1, { error: 'Attachment ID is required' }),
});

/**
 * Attachment Type Inference
 */
export type QuoteAttachmentInput = z.infer<typeof QuoteAttachmentSchema>;
export type UploadAttachmentInput = z.infer<typeof UploadAttachmentSchema>;
export type DeleteAttachmentInput = z.infer<typeof DeleteAttachmentSchema>;

/**
 * Quote Item Attachment Schemas
 */
export const QuoteItemAttachmentSchema = z.object({
  id: z.string(),
  quoteItemId: z.string(),
  fileName: z.string(),
  fileSize: z.number().int().positive(),
  mimeType: z.string(),
  s3Key: z.string(),
  s3Url: z.string().url(),
  uploadedBy: z.string().nullable(),
  uploadedAt: z.date(),
});

/**
 * Upload Item Attachment Schema (for server-side validation)
 */
export const UploadItemAttachmentSchema = z.object({
  quoteItemId: z.string().min(1, { error: 'Quote item ID is required' }),
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
  attachmentId: z.string().min(1, { error: 'Attachment ID is required' }),
});

/**
 * Item Attachment Type Inference
 */
export type QuoteItemAttachmentInput = z.infer<typeof QuoteItemAttachmentSchema>;
export type UploadItemAttachmentInput = z.infer<typeof UploadItemAttachmentSchema>;
export type DeleteItemAttachmentInput = z.infer<typeof DeleteItemAttachmentSchema>;

/**
 * Create Version Schema
 */
export const CreateVersionSchema = z.object({
  quoteId: z.string().min(1, { error: 'Quote ID is required' }),
});

export type CreateVersionInput = z.infer<typeof CreateVersionSchema>;
