import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { GenderSchema } from './GenderSchema';
import { CustomerStatusSchema } from './CustomerStatusSchema';
import { OrganizationCreateNestedOneWithoutCustomersInputSchema } from './OrganizationCreateNestedOneWithoutCustomersInputSchema';
import { InvoiceCreateNestedManyWithoutCustomerInputSchema } from './InvoiceCreateNestedManyWithoutCustomerInputSchema';

export const CustomerCreateWithoutQuotesInputSchema: z.ZodType<Prisma.CustomerCreateWithoutQuotesInput> = z.strictObject({
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
  organization: z.lazy(() => OrganizationCreateNestedOneWithoutCustomersInputSchema).optional(),
  invoices: z.lazy(() => InvoiceCreateNestedManyWithoutCustomerInputSchema).optional(),
});

export default CustomerCreateWithoutQuotesInputSchema;
