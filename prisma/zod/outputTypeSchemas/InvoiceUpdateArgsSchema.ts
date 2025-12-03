import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { InvoiceIncludeSchema } from '../inputTypeSchemas/InvoiceIncludeSchema'
import { InvoiceUpdateInputSchema } from '../inputTypeSchemas/InvoiceUpdateInputSchema'
import { InvoiceUncheckedUpdateInputSchema } from '../inputTypeSchemas/InvoiceUncheckedUpdateInputSchema'
import { InvoiceWhereUniqueInputSchema } from '../inputTypeSchemas/InvoiceWhereUniqueInputSchema'
import { CustomerArgsSchema } from "../outputTypeSchemas/CustomerArgsSchema"
import { InvoiceItemFindManyArgsSchema } from "../outputTypeSchemas/InvoiceItemFindManyArgsSchema"
import { InvoiceCountOutputTypeArgsSchema } from "../outputTypeSchemas/InvoiceCountOutputTypeArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const InvoiceSelectSchema: z.ZodType<Prisma.InvoiceSelect> = z.object({
  id: z.boolean().optional(),
  invoiceNumber: z.boolean().optional(),
  customerId: z.boolean().optional(),
  status: z.boolean().optional(),
  amount: z.boolean().optional(),
  currency: z.boolean().optional(),
  discount: z.boolean().optional(),
  gst: z.boolean().optional(),
  issuedDate: z.boolean().optional(),
  dueDate: z.boolean().optional(),
  remindersSent: z.boolean().optional(),
  paidDate: z.boolean().optional(),
  paymentMethod: z.boolean().optional(),
  cancelledDate: z.boolean().optional(),
  cancelReason: z.boolean().optional(),
  notes: z.boolean().optional(),
  fileName: z.boolean().optional(),
  fileSize: z.boolean().optional(),
  mimeType: z.boolean().optional(),
  s3Key: z.boolean().optional(),
  s3Url: z.boolean().optional(),
  lastGeneratedAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  deletedAt: z.boolean().optional(),
  customer: z.union([z.boolean(),z.lazy(() => CustomerArgsSchema)]).optional(),
  items: z.union([z.boolean(),z.lazy(() => InvoiceItemFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => InvoiceCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const InvoiceUpdateArgsSchema: z.ZodType<Prisma.InvoiceUpdateArgs> = z.object({
  select: InvoiceSelectSchema.optional(),
  include: z.lazy(() => InvoiceIncludeSchema).optional(),
  data: z.union([ InvoiceUpdateInputSchema, InvoiceUncheckedUpdateInputSchema ]),
  where: InvoiceWhereUniqueInputSchema, 
}).strict();

export default InvoiceUpdateArgsSchema;
