import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteIncludeSchema } from '../inputTypeSchemas/QuoteIncludeSchema'
import { QuoteWhereUniqueInputSchema } from '../inputTypeSchemas/QuoteWhereUniqueInputSchema'
import { CustomerArgsSchema } from "../outputTypeSchemas/CustomerArgsSchema"
import { QuoteItemFindManyArgsSchema } from "../outputTypeSchemas/QuoteItemFindManyArgsSchema"
import { QuoteAttachmentFindManyArgsSchema } from "../outputTypeSchemas/QuoteAttachmentFindManyArgsSchema"
import { QuoteCountOutputTypeArgsSchema } from "../outputTypeSchemas/QuoteCountOutputTypeArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const QuoteSelectSchema: z.ZodType<Prisma.QuoteSelect> = z.object({
  id: z.boolean().optional(),
  quoteNumber: z.boolean().optional(),
  customerId: z.boolean().optional(),
  status: z.boolean().optional(),
  amount: z.boolean().optional(),
  currency: z.boolean().optional(),
  gst: z.boolean().optional(),
  discount: z.boolean().optional(),
  issuedDate: z.boolean().optional(),
  validUntil: z.boolean().optional(),
  acceptedDate: z.boolean().optional(),
  rejectedDate: z.boolean().optional(),
  rejectReason: z.boolean().optional(),
  convertedDate: z.boolean().optional(),
  invoiceId: z.boolean().optional(),
  notes: z.boolean().optional(),
  terms: z.boolean().optional(),
  colorPalette: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  deletedAt: z.boolean().optional(),
  customer: z.union([z.boolean(),z.lazy(() => CustomerArgsSchema)]).optional(),
  items: z.union([z.boolean(),z.lazy(() => QuoteItemFindManyArgsSchema)]).optional(),
  attachments: z.union([z.boolean(),z.lazy(() => QuoteAttachmentFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => QuoteCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const QuoteDeleteArgsSchema: z.ZodType<Prisma.QuoteDeleteArgs> = z.object({
  select: QuoteSelectSchema.optional(),
  include: z.lazy(() => QuoteIncludeSchema).optional(),
  where: QuoteWhereUniqueInputSchema, 
}).strict();

export default QuoteDeleteArgsSchema;
