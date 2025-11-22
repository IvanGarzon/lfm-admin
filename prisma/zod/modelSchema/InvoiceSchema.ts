import { z } from 'zod';
import { Prisma } from '@/prisma/client'
import { InvoiceStatusSchema } from '../inputTypeSchemas/InvoiceStatusSchema'
import { CustomerWithRelationsSchema } from './CustomerSchema'
import type { CustomerWithRelations } from './CustomerSchema'
import { InvoiceItemWithRelationsSchema } from './InvoiceItemSchema'
import type { InvoiceItemWithRelations } from './InvoiceItemSchema'

/////////////////////////////////////////
// INVOICE SCHEMA
/////////////////////////////////////////

export const InvoiceSchema = z.object({
  status: InvoiceStatusSchema,
  id: z.cuid(),
  invoiceNumber: z.string(),
  customerId: z.string(),
  amount: z.instanceof(Prisma.Decimal, { message: "Field 'amount' must be a Decimal. Location: ['Models', 'Invoice']"}),
  currency: z.string(),
  discount: z.instanceof(Prisma.Decimal, { message: "Field 'discount' must be a Decimal. Location: ['Models', 'Invoice']"}),
  gst: z.instanceof(Prisma.Decimal, { message: "Field 'gst' must be a Decimal. Location: ['Models', 'Invoice']"}),
  issuedDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  remindersSent: z.number().int().nullish(),
  paidDate: z.coerce.date().nullish(),
  paymentMethod: z.string().nullish(),
  cancelledDate: z.coerce.date().nullish(),
  cancelReason: z.string().nullish(),
  notes: z.string().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullish(),
})

export type Invoice = z.infer<typeof InvoiceSchema>

/////////////////////////////////////////
// INVOICE RELATION SCHEMA
/////////////////////////////////////////

export type InvoiceRelations = {
  customer: CustomerWithRelations;
  items: InvoiceItemWithRelations[];
};

export type InvoiceWithRelations = z.infer<typeof InvoiceSchema> & InvoiceRelations

export const InvoiceWithRelationsSchema: z.ZodType<InvoiceWithRelations> = InvoiceSchema.merge(z.object({
  customer: z.lazy(() => CustomerWithRelationsSchema),
  items: z.lazy(() => InvoiceItemWithRelationsSchema).array(),
}))

export default InvoiceSchema;
