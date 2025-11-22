import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { UserCreateNestedOneWithoutSessionsInputSchema } from './UserCreateNestedOneWithoutSessionsInputSchema';

export const SessionCreateInputSchema: z.ZodType<Prisma.SessionCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  sessionToken: z.string(),
  expires: z.coerce.date(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  deviceName: z.string().optional().nullable(),
  deviceType: z.string().optional().nullable(),
  deviceVendor: z.string().optional().nullable(),
  deviceModel: z.string().optional().nullable(),
  osName: z.string().optional().nullable(),
  osVersion: z.string().optional().nullable(),
  browserName: z.string().optional().nullable(),
  browserVersion: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutSessionsInputSchema),
});

export default SessionCreateInputSchema;
