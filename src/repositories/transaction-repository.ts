import { Prisma, PrismaClient, TransactionType, TransactionStatus } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import type { CreateTransactionInput } from '@/schemas/transactions';
import { getPaginationMetadata } from '@/lib/utils';
import {
  TransactionFilters,
  TransactionPagination,
  TransactionStatistics,
  TransactionListItem,
  TransactionTrend,
  TransactionCategoryBreakdown,
  TopTransactionCategory,
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
   * Supports filtering by type (Income/Expense), status (Pending/Completed),
   * and full-text search across description, payee, and reference ID.
   * @param params - Filter parameters for the search
   * @param params.search - Optional search term
   * @param params.type - Optional array of transaction types
   * @param params.status - Optional array of transaction statuses
   * @param params.page - Current page number (1-indexed)
   * @param params.perPage - Number of items per page
   * @param params.sort - Sorting criteria
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
        : [{ createdAt: 'desc' }];

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
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
   * Find a transaction by its unique ID with all associated details.
   * Includes categories, attachments, and links to invoices or vendors.
   * @param id - The ID of the transaction
   * @returns A promise that resolves to the transaction with details or null if not found
   */
  async findByIdWithDetails(id: string): Promise<TransactionListItem | null> {
    const transaction = await this.prisma.transaction.findUnique({
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
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!transaction) {
      return null;
    }

    return {
      ...transaction,
      amount: Number(transaction.amount),
    };
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
   * Create a new transaction record.
   * Automatically generates a unique reference number.
   * @param data - The transaction creation input data
   * @returns A promise that resolves to the created transaction with full details
   * @throws {Error} If retrieval of the created transaction fails
   */
  async createTransaction(data: CreateTransactionInput): Promise<TransactionListItem> {
    const referenceNumber = await TransactionRepository.generateReferenceNumber();

    const transaction = await this.prisma.transaction.create({
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
        vendorId: data.vendorId,
        customerId: data.customerId,
        categories: data.categoryIds
          ? {
              create: data.categoryIds.map((categoryId) => ({
                categoryId,
              })),
            }
          : undefined,
      },
      select: {
        id: true,
      },
    });

    const createdTransaction = await this.findByIdWithDetails(transaction.id);

    if (!createdTransaction) {
      throw new Error('Failed to retrieve created transaction');
    }

    return createdTransaction;
  }

  /**
   * Update an existing transaction record.
   * Syncs category relations if categoryIds are provided.
   * @param id - The ID of the transaction to update
   * @param data - The updated transaction data payload
   * @returns A promise that resolves to the updated transaction with details
   */
  async updateTransaction(
    id: string,
    data: Partial<CreateTransactionInput>,
  ): Promise<TransactionListItem | null> {
    const updatedTransition = await this.prisma.$transaction(async (tx) => {
      if (data.categoryIds) {
        await tx.transactionCategoryOnTransaction.deleteMany({
          where: { transactionId: id },
        });
      }

      const transaction = await tx.transaction.update({
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
          vendorId: data.vendorId,
          customerId: data.customerId,
          categories: data.categoryIds
            ? {
                create: data.categoryIds.map((categoryId) => ({
                  categoryId,
                })),
              }
            : undefined,
        },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          invoice: {
            include: {
              customer: true,
            },
          },
          vendor: true,
          attachments: true,
        },
      });

      return transaction;
    });

    if (!updatedTransition) {
      return null;
    }

    return await this.findByIdWithDetails(updatedTransition.id);
  }

  /**
   * Permanently deletes a transaction record.
   * @param id - The ID of the transaction to remove
   * @returns A promise that resolves to the deleted transaction details
   */
  async deleteTransaction(id: string): Promise<TransactionListItem | null> {
    const transaction = await this.prisma.transaction.delete({
      where: { id },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        invoice: {
          include: {
            customer: true,
          },
        },
        vendor: true,
        attachments: true,
      },
    });

    if (!transaction) {
      return null;
    }

    return await this.findByIdWithDetails(transaction.id);
  }

  /**
   * Aggregates financial statistics for completed transactions.
   * Calculates total income, expenses, cash flow, and counts by status.
   * @param dateFilter - Optional date range for the statistics
   * @param dateFilter.startDate - Inclusive start date
   * @param dateFilter.endDate - Inclusive end date
   * @returns A promise that resolves to a transaction statistics object
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

  /**
   * Retrieves a chronological trend of income versus expenses grouped by month.
   * @param limit - Max number of months to retrieve (defaults to 12)
   * @returns A promise that resolves to an array of trend data points
   */
  async getMonthlyTransactionTrend(limit: number = 12): Promise<TransactionTrend[]> {
    const data = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        to_char(date, 'Mon') as month,
        extract(month from date) as month_num,
        extract(year from date) as year,
        SUM(CASE WHEN type::text = ${TransactionType.INCOME} AND status::text = ${TransactionStatus.COMPLETED}
          THEN amount::numeric ELSE 0 END)::float as income,
        SUM(CASE WHEN type::text = ${TransactionType.EXPENSE} AND status::text = ${TransactionStatus.COMPLETED}
          THEN amount::numeric ELSE 0 END)::float as expense
      FROM transactions
      GROUP BY year, month_num, month
      ORDER BY year DESC, month_num DESC
      LIMIT ${limit}
    `);

    return data
      .map((item) => ({
        month: `${item.month} ${item.year}`,
        income: item.income,
        expense: item.expense,
        net: item.income - item.expense,
      }))
      .reverse();
  }

  /**
   * Provides a breakdown of transaction volume and value per category.
   * Includes percentages of total spend/income.
   * @param dateFilter - Optional date range for the breakdown
   * @returns A promise that resolves to an array of category breakdown objects
   */
  async getCategoryBreakdown(dateFilter?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<TransactionCategoryBreakdown[]> {
    const data = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      WITH category_totals AS (
        SELECT
          tc.name as category,
          SUM(t.amount::numeric)::float as amount,
          COUNT(t.id)::int as transaction_count
        FROM transactions t
        JOIN transaction_category_on_transaction tcot ON t.id = tcot.transaction_id
        JOIN transaction_categories tc ON tcot.category_id = tc.id
        WHERE t.status::text = ${TransactionStatus.COMPLETED}
          ${dateFilter?.startDate || dateFilter?.endDate ? Prisma.sql`AND t.date >= ${dateFilter.startDate || new Date(0)} AND t.date <= ${dateFilter.endDate || new Date()}` : Prisma.empty}
        GROUP BY tc.name
      ),
      total_amount AS (
        SELECT SUM(amount)::float as total FROM category_totals
      )
      SELECT
        ct.category,
        ct.amount,
        (ct.amount / NULLIF(ta.total, 0) * 100)::float as percentage,
        ct.transaction_count as "transactionCount"
      FROM category_totals ct
      CROSS JOIN total_amount ta
      ORDER BY ct.amount DESC
    `);

    return data.map((item) => ({
      category: item.category,
      amount: item.amount || 0,
      percentage: item.percentage || 0,
      transactionCount: item.transactionCount || 0,
    }));
  }

  /**
   * Retrieves the top-performing or highest-cost categories.
   * Includes average transaction value for each category.
   * @param limit - Number of top categories to return
   * @returns A promise that resolves to an array of top transaction categories
   */
  async getTopCategories(limit: number = 5): Promise<TopTransactionCategory[]> {
    const data = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        tc.id as "categoryId",
        tc.name as "categoryName",
        SUM(t.amount::numeric)::float as "totalAmount",
        COUNT(t.id)::int as "transactionCount",
        AVG(t.amount::numeric)::float as "avgTransactionAmount"
      FROM transactions t
      JOIN transaction_category_on_transaction tcot ON t.id = tcot.transaction_id
      JOIN transaction_categories tc ON tcot.category_id = tc.id
      WHERE t.status::text = ${TransactionStatus.COMPLETED}
      GROUP BY tc.id, tc.name
      ORDER BY "totalAmount" DESC
      LIMIT ${limit}
    `);

    return data.map((item) => ({
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      totalAmount: item.totalAmount || 0,
      transactionCount: item.transactionCount || 0,
      avgTransactionAmount: item.avgTransactionAmount || 0,
    }));
  }

  /**
   * Retrieves all active transaction categories ordered by name.
   * @returns A promise resolving to an array of active categories.
   */
  async getActiveCategories(): Promise<
    Array<{ id: string; name: string; description: string | null }>
  > {
    return this.prisma.transactionCategory.findMany({
      where: { isActive: true },
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Finds an existing active category by name (case-insensitive) or creates a new one.
   * @param name - The category name to find or create.
   * @returns A promise resolving to the found or created category.
   */
  async findOrCreateCategory(
    name: string,
  ): Promise<{ id: string; name: string; description: string | null }> {
    const existing = await this.prisma.transactionCategory.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: { id: true, name: true, description: true },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.transactionCategory.create({
      data: { name, isActive: true },
      select: { id: true, name: true, description: true },
    });
  }

  /**
   * Finds a transaction attachment by its ID.
   * @param id - The attachment ID.
   * @returns A promise resolving to the attachment or undefined if not found.
   */
  async findAttachmentById(
    id: string,
  ): Promise<{ s3Key: string; transactionId: string; fileName: string } | undefined> {
    const result = await this.prisma.transactionAttachment.findUnique({
      where: { id },
      select: { s3Key: true, transactionId: true, fileName: true },
    });

    return result ?? undefined;
  }

  /**
   * Creates a new attachment record for a transaction.
   * @param data - The attachment data including S3 location and metadata.
   * @returns A promise resolving to the created attachment.
   */
  async createAttachment(data: {
    transactionId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    s3Key: string;
    s3Url: string;
    uploadedBy: string;
  }): Promise<{ id: string; fileName: string; fileSize: number; mimeType: string; s3Url: string }> {
    return this.prisma.transactionAttachment.create({
      data,
      select: { id: true, fileName: true, fileSize: true, mimeType: true, s3Url: true },
    });
  }

  /**
   * Deletes a transaction attachment record by its ID.
   * @param id - The attachment ID to delete.
   * @returns A promise that resolves when the deletion is complete.
   */
  async deleteAttachment(id: string): Promise<void> {
    await this.prisma.transactionAttachment.delete({ where: { id } });
  }
}
