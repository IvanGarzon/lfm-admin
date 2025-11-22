import { Prisma, User } from '@/prisma/client';
import { prisma } from '@/lib/prisma';
import { BaseRepository } from '@/lib/baseRepository';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(prisma.user);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  async create(payload: Prisma.UserCreateInput): Promise<User> {
    return await prisma.user.create({
      data: {
        ...payload,
      },
    });
  }
}
