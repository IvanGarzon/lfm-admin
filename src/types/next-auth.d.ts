import { DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: DefaultUser & {
      id: string;
      image?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      activeSessions?: number;
    };
    sessionToken?: string;
    id: string;
  }

  interface User extends DefaultUser {
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
  }
}
