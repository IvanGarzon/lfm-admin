import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { GenderSchema } from './GenderSchema';
import { EmployeeStatusSchema } from './EmployeeStatusSchema';

export const EmployeeUncheckedCreateInputSchema: z.ZodType<Prisma.EmployeeUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string(),
  gender: z.lazy(() => GenderSchema).optional().nullable(),
  dob: z.coerce.date().optional().nullable(),
  rate: z.number().optional(),
  status: z.lazy(() => EmployeeStatusSchema).optional(),
  avatarUrl: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export default EmployeeUncheckedCreateInputSchema;
