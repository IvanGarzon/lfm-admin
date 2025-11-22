import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { GenderSchema } from './GenderSchema';
import { CustomerStatusSchema } from './CustomerStatusSchema';
import { InvoiceCreateNestedManyWithoutCustomerInputSchema } from './InvoiceCreateNestedManyWithoutCustomerInputSchema';
import { QuoteCreateNestedManyWithoutCustomerInputSchema } from './QuoteCreateNestedManyWithoutCustomerInputSchema';

export const CustomerCreateWithoutOrganizationInputSchema: z.ZodType<Prisma.CustomerCreateWithoutOrganizationInput> = z.strictObject({
  id: z.cuid().optional(),
  firstName: z.string(),
  lastName: z.string(),
  gender: z.lazy(() => GenderSchema),
  email: z.string(),
  phone: z.string().optional().nullable(),
  status: z.lazy(() => CustomerStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  invoices: z.lazy(() => InvoiceCreateNestedManyWithoutCustomerInputSchema).optional(),
  quotes: z.lazy(() => QuoteCreateNestedManyWithoutCustomerInputSchema).optional(),
});

export default CustomerCreateWithoutOrganizationInputSchema;
