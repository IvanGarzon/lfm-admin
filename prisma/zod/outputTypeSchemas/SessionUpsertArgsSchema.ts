import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { SessionIncludeSchema } from '../inputTypeSchemas/SessionIncludeSchema'
import { SessionWhereUniqueInputSchema } from '../inputTypeSchemas/SessionWhereUniqueInputSchema'
import { SessionCreateInputSchema } from '../inputTypeSchemas/SessionCreateInputSchema'
import { SessionUncheckedCreateInputSchema } from '../inputTypeSchemas/SessionUncheckedCreateInputSchema'
import { SessionUpdateInputSchema } from '../inputTypeSchemas/SessionUpdateInputSchema'
import { SessionUncheckedUpdateInputSchema } from '../inputTypeSchemas/SessionUncheckedUpdateInputSchema'
import { UserArgsSchema } from "../outputTypeSchemas/UserArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const SessionSelectSchema: z.ZodType<Prisma.SessionSelect> = z.object({
  id: z.boolean().optional(),
  sessionToken: z.boolean().optional(),
  userId: z.boolean().optional(),
  expires: z.boolean().optional(),
  ipAddress: z.boolean().optional(),
  userAgent: z.boolean().optional(),
  isActive: z.boolean().optional(),
  deviceName: z.boolean().optional(),
  deviceType: z.boolean().optional(),
  deviceVendor: z.boolean().optional(),
  deviceModel: z.boolean().optional(),
  osName: z.boolean().optional(),
  osVersion: z.boolean().optional(),
  browserName: z.boolean().optional(),
  browserVersion: z.boolean().optional(),
  country: z.boolean().optional(),
  region: z.boolean().optional(),
  city: z.boolean().optional(),
  latitude: z.boolean().optional(),
  longitude: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

export const SessionUpsertArgsSchema: z.ZodType<Prisma.SessionUpsertArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: z.lazy(() => SessionIncludeSchema).optional(),
  where: SessionWhereUniqueInputSchema, 
  create: z.union([ SessionCreateInputSchema, SessionUncheckedCreateInputSchema ]),
  update: z.union([ SessionUpdateInputSchema, SessionUncheckedUpdateInputSchema ]),
}).strict();

export default SessionUpsertArgsSchema;
