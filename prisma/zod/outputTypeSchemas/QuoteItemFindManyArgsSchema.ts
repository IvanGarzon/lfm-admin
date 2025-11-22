import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteItemIncludeSchema } from '../inputTypeSchemas/QuoteItemIncludeSchema'
import { QuoteItemWhereInputSchema } from '../inputTypeSchemas/QuoteItemWhereInputSchema'
import { QuoteItemOrderByWithRelationInputSchema } from '../inputTypeSchemas/QuoteItemOrderByWithRelationInputSchema'
import { QuoteItemWhereUniqueInputSchema } from '../inputTypeSchemas/QuoteItemWhereUniqueInputSchema'
import { QuoteItemScalarFieldEnumSchema } from '../inputTypeSchemas/QuoteItemScalarFieldEnumSchema'
import { QuoteArgsSchema } from "../outputTypeSchemas/QuoteArgsSchema"
import { ProductArgsSchema } from "../outputTypeSchemas/ProductArgsSchema"
import { QuoteItemAttachmentFindManyArgsSchema } from "../outputTypeSchemas/QuoteItemAttachmentFindManyArgsSchema"
import { QuoteItemCountOutputTypeArgsSchema } from "../outputTypeSchemas/QuoteItemCountOutputTypeArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const QuoteItemSelectSchema: z.ZodType<Prisma.QuoteItemSelect> = z.object({
  id: z.boolean().optional(),
  quoteId: z.boolean().optional(),
  description: z.boolean().optional(),
  quantity: z.boolean().optional(),
  unitPrice: z.boolean().optional(),
  total: z.boolean().optional(),
  order: z.boolean().optional(),
  productId: z.boolean().optional(),
  notes: z.boolean().optional(),
  colorPalette: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  quote: z.union([z.boolean(),z.lazy(() => QuoteArgsSchema)]).optional(),
  product: z.union([z.boolean(),z.lazy(() => ProductArgsSchema)]).optional(),
  attachments: z.union([z.boolean(),z.lazy(() => QuoteItemAttachmentFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => QuoteItemCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const QuoteItemFindManyArgsSchema: z.ZodType<Prisma.QuoteItemFindManyArgs> = z.object({
  select: QuoteItemSelectSchema.optional(),
  include: z.lazy(() => QuoteItemIncludeSchema).optional(),
  where: QuoteItemWhereInputSchema.optional(), 
  orderBy: z.union([ QuoteItemOrderByWithRelationInputSchema.array(), QuoteItemOrderByWithRelationInputSchema ]).optional(),
  cursor: QuoteItemWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ QuoteItemScalarFieldEnumSchema, QuoteItemScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export default QuoteItemFindManyArgsSchema;
