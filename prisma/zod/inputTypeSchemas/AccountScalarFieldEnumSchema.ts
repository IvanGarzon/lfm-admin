import { z } from 'zod';

export const AccountScalarFieldEnumSchema = z.enum(['id','userId','type','provider','providerAccountId','refreshToken','accessToken','expiresAt','tokenType','scope','idToken','sessionState']);

export default AccountScalarFieldEnumSchema;
