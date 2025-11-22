import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { GenderSchema } from './GenderSchema';
import { CustomerStatusSchema } from './CustomerStatusSchema';
import { InvoiceUncheckedCreateNestedManyWithoutCustomerInputSchema } from './InvoiceUncheckedCreateNestedManyWithoutCustomerInputSchema';
import { QuoteUncheckedCreateNestedManyWithoutCustomerInputSchema } from './QuoteUncheckedCreateNestedManyWithoutCustomerInputSchema';

export const CustomerUncheckedCreateWithoutOrganizationInputSchema: z.ZodType<Prisma.CustomerUncheckedCreateWithoutOrganizationInput> = z.strictObject({
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
  invoices: z.lazy(() => InvoiceUncheckedCreateNestedManyWithoutCustomerInputSchema).optional(),
  quotes: z.lazy(() => QuoteUncheckedCreateNestedManyWithoutCustomerInputSchema).optional(),
});

export default CustomerUncheckedCreateWithoutOrganizationInputSchema;
