import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteAttachmentIncludeSchema } from '../inputTypeSchemas/QuoteAttachmentIncludeSchema'
import { QuoteAttachmentWhereInputSchema } from '../inputTypeSchemas/QuoteAttachmentWhereInputSchema'
import { QuoteAttachmentOrderByWithRelationInputSchema } from '../inputTypeSchemas/QuoteAttachmentOrderByWithRelationInputSchema'
import { QuoteAttachmentWhereUniqueInputSchema } from '../inputTypeSchemas/QuoteAttachmentWhereUniqueInputSchema'
import { QuoteAttachmentScalarFieldEnumSchema } from '../inputTypeSchemas/QuoteAttachmentScalarFieldEnumSchema'
import { QuoteArgsSchema } from "../outputTypeSchemas/QuoteArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const QuoteAttachmentSelectSchema: z.ZodType<Prisma.QuoteAttachmentSelect> = z.object({
  id: z.boolean().optional(),
  quoteId: z.boolean().optional(),
  fileName: z.boolean().optional(),
  fileSize: z.boolean().optional(),
  mimeType: z.boolean().optional(),
  s3Key: z.boolean().optional(),
  s3Url: z.boolean().optional(),
  uploadedBy: z.boolean().optional(),
  uploadedAt: z.boolean().optional(),
  quote: z.union([z.boolean(),z.lazy(() => QuoteArgsSchema)]).optional(),
}).strict()

export const QuoteAttachmentFindFirstArgsSchema: z.ZodType<Prisma.QuoteAttachmentFindFirstArgs> = z.object({
  select: QuoteAttachmentSelectSchema.optional(),
  include: z.lazy(() => QuoteAttachmentIncludeSchema).optional(),
  where: QuoteAttachmentWhereInputSchema.optional(), 
  orderBy: z.union([ QuoteAttachmentOrderByWithRelationInputSchema.array(), QuoteAttachmentOrderByWithRelationInputSchema ]).optional(),
  cursor: QuoteAttachmentWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ QuoteAttachmentScalarFieldEnumSchema, QuoteAttachmentScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export default QuoteAttachmentFindFirstArgsSchema;
