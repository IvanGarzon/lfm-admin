import { Prisma, PrismaClient, Account } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';

export interface CreateAccountData {
  type: string;
  provider: string;
  providerAccountId: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: number | null;
  tokenType?: string | null;
  scope?: string | null;
  idToken?: string | null;
}

/**
 * Account Repository
 * Handles all database operations for OAuth provider accounts
 * Extends BaseRepository for common CRUD operations
 */
export class AccountRepository extends BaseRepository<Prisma.AccountGetPayload<object>> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected get model(): ModelDelegateOperations<Prisma.AccountGetPayload<object>> {
    return this.prisma.account as unknown as ModelDelegateOperations<
      Prisma.AccountGetPayload<object>
    >;
  }

  /**
   * Finds an account by provider and provider account ID.
   * This is used to check if an OAuth account is already linked to a user.
   * @param provider - OAuth provider name (e.g., 'google', 'github')
   * @param providerAccountId - Unique account ID from the provider
   * @returns The account record or null if not found
   */
  async findByProviderAndAccountId(
    provider: string,
    providerAccountId: string,
  ): Promise<Account | null> {
    return this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
    });
  }

  /**
   * Creates a new account record linked to a user.
   * @param userId - The user ID to link this account to
   * @param accountData - OAuth account data from the provider
   * @returns The newly created account
   */
  async createAccount(userId: string, accountData: CreateAccountData): Promise<Account> {
    return this.prisma.account.create({
      data: {
        userId,
        type: accountData.type,
        provider: accountData.provider,
        providerAccountId: accountData.providerAccountId,
        accessToken: accountData.accessToken,
        refreshToken: accountData.refreshToken,
        expiresAt: accountData.expiresAt,
        tokenType: accountData.tokenType,
        scope: accountData.scope,
        idToken: accountData.idToken,
      },
    });
  }

  /**
   * Retrieves all accounts for a given user.
   * Useful for account management and linking/unlinking features.
   * @param userId - The user ID
   * @returns Array of account records
   */
  async findAccountsByUserId(userId: string): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: { userId },
      orderBy: { provider: 'asc' },
    });
  }
}
