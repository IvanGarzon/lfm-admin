import { z } from 'zod';
import { GenderSchema } from '../inputTypeSchemas/GenderSchema'
import { CustomerStatusSchema } from '../inputTypeSchemas/CustomerStatusSchema'
import { OrganizationWithRelationsSchema } from './OrganizationSchema'
import type { OrganizationWithRelations } from './OrganizationSchema'
import { InvoiceWithRelationsSchema } from './InvoiceSchema'
import type { InvoiceWithRelations } from './InvoiceSchema'
import { QuoteWithRelationsSchema } from './QuoteSchema'
import type { QuoteWithRelations } from './QuoteSchema'

/////////////////////////////////////////
// CUSTOMER SCHEMA
/////////////////////////////////////////

export const CustomerSchema = z.object({
  gender: GenderSchema,
  status: CustomerStatusSchema,
  id: z.cuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().nullish(),
  organizationId: z.string().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullish(),
})

export type Customer = z.infer<typeof CustomerSchema>

/////////////////////////////////////////
// CUSTOMER RELATION SCHEMA
/////////////////////////////////////////

export type CustomerRelations = {
  organization?: OrganizationWithRelations | null;
  invoices: InvoiceWithRelations[];
  quotes: QuoteWithRelations[];
};

export type CustomerWithRelations = z.infer<typeof CustomerSchema> & CustomerRelations

export const CustomerWithRelationsSchema: z.ZodType<CustomerWithRelations> = CustomerSchema.merge(z.object({
  organization: z.lazy(() => OrganizationWithRelationsSchema).nullish(),
  invoices: z.lazy(() => InvoiceWithRelationsSchema).array(),
  quotes: z.lazy(() => QuoteWithRelationsSchema).array(),
}))

export default CustomerSchema;
