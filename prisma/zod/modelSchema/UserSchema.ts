import { z } from 'zod';
import { AccountWithRelationsSchema } from './AccountSchema'
import type { AccountWithRelations } from './AccountSchema'
import { SessionWithRelationsSchema } from './SessionSchema'
import type { SessionWithRelations } from './SessionSchema'

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  id: z.cuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullish(),
  emailVerified: z.coerce.date().nullish(),
  avatarUrl: z.string().nullish(),
  password: z.string().nullish(),
})

export type User = z.infer<typeof UserSchema>

/////////////////////////////////////////
// USER RELATION SCHEMA
/////////////////////////////////////////

export type UserRelations = {
  accounts: AccountWithRelations[];
  sessions: SessionWithRelations[];
};

export type UserWithRelations = z.infer<typeof UserSchema> & UserRelations

export const UserWithRelationsSchema: z.ZodType<UserWithRelations> = UserSchema.merge(z.object({
  accounts: z.lazy(() => AccountWithRelationsSchema).array(),
  sessions: z.lazy(() => SessionWithRelationsSchema).array(),
}))

export default UserSchema;
