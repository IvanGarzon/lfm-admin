import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { OrganizationIncludeSchema } from '../inputTypeSchemas/OrganizationIncludeSchema'
import { OrganizationCreateInputSchema } from '../inputTypeSchemas/OrganizationCreateInputSchema'
import { OrganizationUncheckedCreateInputSchema } from '../inputTypeSchemas/OrganizationUncheckedCreateInputSchema'
import { CustomerFindManyArgsSchema } from "../outputTypeSchemas/CustomerFindManyArgsSchema"
import { OrganizationCountOutputTypeArgsSchema } from "../outputTypeSchemas/OrganizationCountOutputTypeArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const OrganizationSelectSchema: z.ZodType<Prisma.OrganizationSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  address: z.boolean().optional(),
  city: z.boolean().optional(),
  state: z.boolean().optional(),
  postcode: z.boolean().optional(),
  country: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  customers: z.union([z.boolean(),z.lazy(() => CustomerFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => OrganizationCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const OrganizationCreateArgsSchema: z.ZodType<Prisma.OrganizationCreateArgs> = z.object({
  select: OrganizationSelectSchema.optional(),
  include: z.lazy(() => OrganizationIncludeSchema).optional(),
  data: z.union([ OrganizationCreateInputSchema, OrganizationUncheckedCreateInputSchema ]),
}).strict();

export default OrganizationCreateArgsSchema;
