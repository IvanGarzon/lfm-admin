import { DefaultUser } from 'next-auth';
import { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: DefaultUser & {
      id: string;
      image?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      activeSessions?: number;
      role: UserRole;
    };
    sessionToken?: string;
    id: string;
  }

  interface User extends DefaultUser {
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
    role: UserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
  }
}
