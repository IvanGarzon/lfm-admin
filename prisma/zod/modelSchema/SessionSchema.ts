import { z } from 'zod';
import { UserWithRelationsSchema } from './UserSchema'
import type { UserWithRelations } from './UserSchema'

/////////////////////////////////////////
// SESSION SCHEMA
/////////////////////////////////////////

export const SessionSchema = z.object({
  id: z.cuid(),
  sessionToken: z.string(),
  userId: z.string(),
  expires: z.coerce.date(),
  ipAddress: z.string().nullish(),
  userAgent: z.string().nullish(),
  isActive: z.boolean(),
  deviceName: z.string().nullish(),
  deviceType: z.string().nullish(),
  deviceVendor: z.string().nullish(),
  deviceModel: z.string().nullish(),
  osName: z.string().nullish(),
  osVersion: z.string().nullish(),
  browserName: z.string().nullish(),
  browserVersion: z.string().nullish(),
  country: z.string().nullish(),
  region: z.string().nullish(),
  city: z.string().nullish(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Session = z.infer<typeof SessionSchema>

/////////////////////////////////////////
// SESSION RELATION SCHEMA
/////////////////////////////////////////

export type SessionRelations = {
  user: UserWithRelations;
};

export type SessionWithRelations = z.infer<typeof SessionSchema> & SessionRelations

export const SessionWithRelationsSchema: z.ZodType<SessionWithRelations> = SessionSchema.merge(z.object({
  user: z.lazy(() => UserWithRelationsSchema),
}))

export default SessionSchema;
