import Google from 'next-auth/providers/google';
import { env } from 'env';

export const GoogleProvider = Google({
  clientId: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
});
