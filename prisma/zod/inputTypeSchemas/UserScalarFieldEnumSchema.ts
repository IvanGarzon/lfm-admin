import { z } from 'zod';

export const UserScalarFieldEnumSchema = z.enum(['id','firstName','lastName','email','emailVerified','avatarUrl','password']);

export default UserScalarFieldEnumSchema;
