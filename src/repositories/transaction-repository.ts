import {
  Prisma,
  PrismaClient,
  Transaction,
  TransactionType,
  TransactionStatus,
} from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import type { CreateTransactionInput } from '@/schemas/transactions';
import { getPaginationMetadata } from '@/lib/utils';
import {
  TransactionFilters,
  TransactionPagination,
  TransactionStatistics,
  TransactionListItem,
} from '@/features/finances/transactions/types';

/**
 * Transaction Repository
 * Handles all database operations for transactions
 * Extends BaseRepository for common CRUD operations
 */
export class TransactionRepository extends BaseRepository<Prisma.TransactionGetPayload<object>> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected get model(): ModelDelegateOperations<Prisma.TransactionGetPayload<object>> {
    return this.prisma.transaction as unknown as ModelDelegateOperations<
      Prisma.TransactionGetPayload<object>
    >;
  }

  /**
   * Search and paginate transactions with advanced filtering capabilities.
   * @param params - Filter parameters for the search
   * @returns A promise that resolves to paginated transaction results with metadata
   */
  async searchAndPaginate(params: TransactionFilters): Promise<TransactionPagination> {
    const { search, type, status, page, perPage, sort } = params;

    const whereClause: Prisma.TransactionWhereInput = {};

    // Type filter
    if (type && type.length > 0) {
      whereClause.type = { in: type };
    }

    // Status filter
    if (status && status.length > 0) {
      whereClause.status = {
        in: status,
      };
    }

    // Search filter
    if (search) {
      const searchFilter: Prisma.StringFilter = {
        contains: search,
        mode: Prisma.QueryMode.insensitive,
      };

      whereClause.OR = [
        { description: searchFilter },
        { payee: searchFilter },
        { referenceId: searchFilter },
      ];
    }

    const skip = page > 0 ? perPage * (page - 1) : 0;

    const orderBy: Prisma.TransactionOrderByWithRelationInput[] =
      sort && sort.length > 0
        ? sort.map((sortItem) => {
            const order: Prisma.SortOrder = sortItem.desc ? 'desc' : 'asc';
            return { [sortItem.id]: order };
          })
        : [{ date: 'desc' }];

    const countOperation = this.prisma.transaction.count({ where: whereClause });
    const findManyOperation = this.prisma.transaction.findMany({
      where: whereClause,
      include: {
        categories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            s3Key: true,
            s3Url: true,
            uploadedBy: true,
            uploadedAt: true,
          },
          orderBy: {
            uploadedAt: 'desc',
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            customer: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy,
      skip,
      take: perPage,
    });

    const [totalItems, transactions] = await this.prisma.$transaction([
      countOperation,
      findManyOperation,
    ]);

    const items: TransactionListItem[] = transactions.map((transaction) => ({
      ...transaction,
      amount: Number(transaction.amount),
    }));

    return {
      items,
      pagination: getPaginationMetadata(totalItems, perPage, page),
    };
  }

  /**
   * Find a transaction by ID with invoice details
   * @param id - The ID of the transaction
   * @returns A promise that resolves to the transaction or null
   */
  async findByIdWithDetails(id: string) {
    return this.prisma.transaction.findUnique({
      where: { id },
      include: {
        categories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            s3Key: true,
            s3Url: true,
            uploadedBy: true,
            uploadedAt: true,
          },
          orderBy: {
            uploadedAt: 'desc',
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            customer: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Generates a unique transaction reference number using UUID.
   * Format: TRX-XXXXXXXX where X is uppercase hex from UUID.
   * @returns A promise that resolves to the generated reference number
   * @example "TRX-A1B2C3D4"
   */
  static async generateReferenceNumber(): Promise<string> {
    const crypto = await import('crypto');
    const uuid = crypto.randomUUID();
    const shortId = uuid.replace(/-/g, '').substring(0, 8).toUpperCase();
    return `TRX-${shortId}`;
  }

  /**
   * Create a new transaction
   * @param data - The transaction data
   * @returns A promise that resolves to the created transaction
   */
  async createTransaction(data: CreateTransactionInput): Promise<Transaction> {
    const referenceNumber = await TransactionRepository.generateReferenceNumber();

    return this.prisma.transaction.create({
      data: {
        type: data.type,
        date: data.date,
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        payee: data.payee,
        status: data.status,
        referenceNumber,
        referenceId: data.referenceId,
        invoiceId: data.invoiceId,
        categories: data.categoryIds
          ? {
              create: data.categoryIds.map((categoryId) => ({
                categoryId,
              })),
            }
          : undefined,
      },
    });
  }

  /**
   * Update an existing transaction
   * @param id - The ID of the transaction to update
   * @param data - The updated transaction data
   * @returns A promise that resolves to the updated transaction
   */
  async updateTransaction(id: string, data: Partial<CreateTransactionInput>): Promise<Transaction> {
    // If categoryIds are provided, we need to update the categories
    if (data.categoryIds) {
      // Delete existing categories and create new ones
      await this.prisma.transactionCategoryOnTransaction.deleteMany({
        where: { transactionId: id },
      });
    }

    return this.prisma.transaction.update({
      where: { id },
      data: {
        type: data.type,
        date: data.date,
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        payee: data.payee,
        status: data.status,
        referenceId: data.referenceId,
        invoiceId: data.invoiceId,
        categories: data.categoryIds
          ? {
              create: data.categoryIds.map((categoryId) => ({
                categoryId,
              })),
            }
          : undefined,
      },
    });
  }

  /**
   * Delete a transaction
   * @param id - The ID of the transaction to delete
   * @returns A promise that resolves to the deleted transaction
   */
  async deleteTransaction(id: string): Promise<Transaction> {
    return this.prisma.transaction.delete({
      where: { id },
    });
  }

  /**
   * Get transaction statistics
   * @param dateFilter - Optional date range filter
   * @returns A promise that resolves to transaction statistics
   */
  async getStatistics(dateFilter?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<TransactionStatistics> {
    const whereClause: Prisma.TransactionWhereInput = {
      status: TransactionStatus.COMPLETED,
    };

    if (dateFilter?.startDate || dateFilter?.endDate) {
      whereClause.date = {};
      if (dateFilter.startDate) {
        whereClause.date.gte = dateFilter.startDate;
      }
      if (dateFilter.endDate) {
        whereClause.date.lte = dateFilter.endDate;
      }
    }

    const [incomeSum, expenseSum, pendingCount, completedCount] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { ...whereClause, type: TransactionType.INCOME },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...whereClause, type: TransactionType.EXPENSE },
        _sum: { amount: true },
      }),
      this.prisma.transaction.count({
        where: {
          ...whereClause,
          status: TransactionStatus.PENDING,
        },
      }),
      this.prisma.transaction.count({
        where: {
          ...whereClause,
          status: TransactionStatus.COMPLETED,
        },
      }),
    ]);

    const totalIncome = Number(incomeSum._sum.amount || 0);
    const totalExpense = Number(expenseSum._sum.amount || 0);

    return {
      totalIncome,
      totalExpense,
      netCashFlow: totalIncome - totalExpense,
      pendingTransactions: pendingCount,
      completedTransactions: completedCount,
    };
  }
}
