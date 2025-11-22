import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { InvoiceItemIncludeSchema } from '../inputTypeSchemas/InvoiceItemIncludeSchema'
import { InvoiceItemWhereInputSchema } from '../inputTypeSchemas/InvoiceItemWhereInputSchema'
import { InvoiceItemOrderByWithRelationInputSchema } from '../inputTypeSchemas/InvoiceItemOrderByWithRelationInputSchema'
import { InvoiceItemWhereUniqueInputSchema } from '../inputTypeSchemas/InvoiceItemWhereUniqueInputSchema'
import { InvoiceItemScalarFieldEnumSchema } from '../inputTypeSchemas/InvoiceItemScalarFieldEnumSchema'
import { InvoiceArgsSchema } from "../outputTypeSchemas/InvoiceArgsSchema"
import { ProductArgsSchema } from "../outputTypeSchemas/ProductArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const InvoiceItemSelectSchema: z.ZodType<Prisma.InvoiceItemSelect> = z.object({
  id: z.boolean().optional(),
  invoiceId: z.boolean().optional(),
  description: z.boolean().optional(),
  quantity: z.boolean().optional(),
  unitPrice: z.boolean().optional(),
  total: z.boolean().optional(),
  productId: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  invoice: z.union([z.boolean(),z.lazy(() => InvoiceArgsSchema)]).optional(),
  product: z.union([z.boolean(),z.lazy(() => ProductArgsSchema)]).optional(),
}).strict()

export const InvoiceItemFindManyArgsSchema: z.ZodType<Prisma.InvoiceItemFindManyArgs> = z.object({
  select: InvoiceItemSelectSchema.optional(),
  include: z.lazy(() => InvoiceItemIncludeSchema).optional(),
  where: InvoiceItemWhereInputSchema.optional(), 
  orderBy: z.union([ InvoiceItemOrderByWithRelationInputSchema.array(), InvoiceItemOrderByWithRelationInputSchema ]).optional(),
  cursor: InvoiceItemWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ InvoiceItemScalarFieldEnumSchema, InvoiceItemScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export default InvoiceItemFindManyArgsSchema;
