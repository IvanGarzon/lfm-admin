import { Prisma, User, PrismaClient } from '@/prisma/client';
import { prisma } from '@/lib/prisma';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';

/**
 * User Repository
 * Handles all database operations for users
 * Extends BaseRepository for common CRUD operations
 */
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super();
  }

  protected get model(): ModelDelegateOperations<User> {
    return prisma.user as unknown as ModelDelegateOperations<User>;
  }

  /**
   * Locates a single user record by their matching email address.
   * @param email - The email string to query
   * @returns A promise that resolves to the user object if found, or null
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }
}
