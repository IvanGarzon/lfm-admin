import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { InvoiceIncludeSchema } from '../inputTypeSchemas/InvoiceIncludeSchema'
import { InvoiceCreateInputSchema } from '../inputTypeSchemas/InvoiceCreateInputSchema'
import { InvoiceUncheckedCreateInputSchema } from '../inputTypeSchemas/InvoiceUncheckedCreateInputSchema'
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
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  deletedAt: z.boolean().optional(),
  customer: z.union([z.boolean(),z.lazy(() => CustomerArgsSchema)]).optional(),
  items: z.union([z.boolean(),z.lazy(() => InvoiceItemFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => InvoiceCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const InvoiceCreateArgsSchema: z.ZodType<Prisma.InvoiceCreateArgs> = z.object({
  select: InvoiceSelectSchema.optional(),
  include: z.lazy(() => InvoiceIncludeSchema).optional(),
  data: z.union([ InvoiceCreateInputSchema, InvoiceUncheckedCreateInputSchema ]),
}).strict();

export default InvoiceCreateArgsSchema;
