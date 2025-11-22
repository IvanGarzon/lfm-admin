import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { StatesSchema } from './StatesSchema';

export const OrganizationCreateWithoutCustomersInputSchema: z.ZodType<Prisma.OrganizationCreateWithoutCustomersInput> = z.strictObject({
  id: z.cuid().optional(),
  name: z.string(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.lazy(() => StatesSchema).optional().nullable(),
  postcode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export default OrganizationCreateWithoutCustomersInputSchema;
