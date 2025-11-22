import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteItemAttachmentIncludeSchema } from '../inputTypeSchemas/QuoteItemAttachmentIncludeSchema'
import { QuoteItemAttachmentWhereInputSchema } from '../inputTypeSchemas/QuoteItemAttachmentWhereInputSchema'
import { QuoteItemAttachmentOrderByWithRelationInputSchema } from '../inputTypeSchemas/QuoteItemAttachmentOrderByWithRelationInputSchema'
import { QuoteItemAttachmentWhereUniqueInputSchema } from '../inputTypeSchemas/QuoteItemAttachmentWhereUniqueInputSchema'
import { QuoteItemAttachmentScalarFieldEnumSchema } from '../inputTypeSchemas/QuoteItemAttachmentScalarFieldEnumSchema'
import { QuoteItemArgsSchema } from "../outputTypeSchemas/QuoteItemArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const QuoteItemAttachmentSelectSchema: z.ZodType<Prisma.QuoteItemAttachmentSelect> = z.object({
  id: z.boolean().optional(),
  quoteItemId: z.boolean().optional(),
  fileName: z.boolean().optional(),
  fileSize: z.boolean().optional(),
  mimeType: z.boolean().optional(),
  s3Key: z.boolean().optional(),
  s3Url: z.boolean().optional(),
  uploadedBy: z.boolean().optional(),
  uploadedAt: z.boolean().optional(),
  quoteItem: z.union([z.boolean(),z.lazy(() => QuoteItemArgsSchema)]).optional(),
}).strict()

export const QuoteItemAttachmentFindFirstArgsSchema: z.ZodType<Prisma.QuoteItemAttachmentFindFirstArgs> = z.object({
  select: QuoteItemAttachmentSelectSchema.optional(),
  include: z.lazy(() => QuoteItemAttachmentIncludeSchema).optional(),
  where: QuoteItemAttachmentWhereInputSchema.optional(), 
  orderBy: z.union([ QuoteItemAttachmentOrderByWithRelationInputSchema.array(), QuoteItemAttachmentOrderByWithRelationInputSchema ]).optional(),
  cursor: QuoteItemAttachmentWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ QuoteItemAttachmentScalarFieldEnumSchema, QuoteItemAttachmentScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export default QuoteItemAttachmentFindFirstArgsSchema;
