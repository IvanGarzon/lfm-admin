import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { GenderSchema } from './GenderSchema';
import { CustomerStatusSchema } from './CustomerStatusSchema';

export const CustomerCreateManyOrganizationInputSchema: z.ZodType<Prisma.CustomerCreateManyOrganizationInput> = z.strictObject({
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
});

export default CustomerCreateManyOrganizationInputSchema;
