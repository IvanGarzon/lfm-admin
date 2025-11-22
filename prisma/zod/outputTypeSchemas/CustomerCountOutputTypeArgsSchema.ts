import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { CustomerCountOutputTypeSelectSchema } from './CustomerCountOutputTypeSelectSchema';

export const CustomerCountOutputTypeArgsSchema: z.ZodType<Prisma.CustomerCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => CustomerCountOutputTypeSelectSchema).nullish(),
}).strict();

export default CustomerCountOutputTypeSelectSchema;
