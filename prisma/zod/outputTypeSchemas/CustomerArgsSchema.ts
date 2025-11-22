import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { CustomerSelectSchema } from '../inputTypeSchemas/CustomerSelectSchema';
import { CustomerIncludeSchema } from '../inputTypeSchemas/CustomerIncludeSchema';

export const CustomerArgsSchema: z.ZodType<Prisma.CustomerDefaultArgs> = z.object({
  select: z.lazy(() => CustomerSelectSchema).optional(),
  include: z.lazy(() => CustomerIncludeSchema).optional(),
}).strict();

export default CustomerArgsSchema;
