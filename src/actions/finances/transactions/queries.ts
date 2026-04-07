'use server';

import { SearchParams } from 'nuqs/server';

import { TransactionRepository } from '@/repositories/transaction-repository';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { withTenantPermission } from '@/lib/action-auth';
import type {
  TransactionListItem,
  TransactionPagination,
  TransactionStatistics,
  TransactionTrend,
  TransactionCategoryBreakdown,
  TopTransactionCategory,
} from '@/features/finances/transactions/types';
import { searchParamsCache } from '@/filters/transactions/transactions-filters';

const transactionRepo = new TransactionRepository(prisma);

/**
 * Retrieves a paginated list of transactions based on specified search and filter criteria.
 * @param searchParams - The search parameters for filtering, sorting, and pagination.
 * @returns A promise that resolves to an `ActionResult` containing the paginated transaction data.
 */
export const getTransactions = withTenantPermission<SearchParams, TransactionPagination>(
  'canReadTransactions',
  async (ctx, searchParams) => {
    try {
      const filters = searchParamsCache.parse(searchParams);
      const result = await transactionRepo.searchAndPaginate(filters, ctx.tenantId);
      return { success: true, data: result };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch transactions');
    }
  },
);

/**
 * Retrieves a single transaction by its unique identifier.
 * @param id - The ID of the transaction to retrieve.
 * @returns A promise that resolves to an `ActionResult` containing the transaction details.
 */
export const getTransactionById = withTenantPermission<string, TransactionListItem>(
  'canReadTransactions',
  async (ctx, id) => {
    try {
      const transaction = await transactionRepo.findByIdWithDetails(id, ctx.tenantId);

      if (!transaction) {
        return { success: false, error: 'Transaction not found' };
      }

      const serializedTransaction: TransactionListItem = {
        ...transaction,
        amount: Number(transaction.amount),
        categories: transaction.categories ?? [],
        attachments: transaction.attachments ?? [],
        invoice: transaction.invoice ?? null,
      };

      return { success: true, data: serializedTransaction };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch transaction');
    }
  },
);

/**
 * Retrieves statistics about transactions.
 * @param dateFilter - An optional object with startDate and endDate to filter the statistics.
 * @returns A promise that resolves to an `ActionResult` containing the transaction statistics.
 */
export const getTransactionStatistics = withTenantPermission<
  { startDate?: Date; endDate?: Date } | undefined,
  TransactionStatistics
>('canReadTransactions', async (ctx, dateFilter) => {
  try {
    const stats = await transactionRepo.getStatistics(ctx.tenantId, dateFilter);
    return { success: true, data: stats };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch transaction statistics');
  }
});

/**
 * Retrieves all active transaction categories.
 * @returns A promise that resolves to an `ActionResult` containing the list of active categories.
 */
export const getTransactionCategories = withTenantPermission<
  void,
  Array<{ id: string; name: string; description: string | null }>
>('canReadTransactions', async (_session) => {
  try {
    const categories = await transactionRepo.getActiveCategories();
    return { success: true, data: categories };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch transaction categories');
  }
});

/**
 * Retrieves monthly transaction trend data showing income vs expense over time.
 * @param limit - The number of months to retrieve. Defaults to 12.
 * @returns A promise that resolves to an `ActionResult` containing the transaction trend data.
 */
export const getTransactionTrend = withTenantPermission<number | undefined, TransactionTrend[]>(
  'canReadTransactions',
  async (ctx, limit) => {
    try {
      const trend = await transactionRepo.getMonthlyTransactionTrend(limit ?? 12, ctx.tenantId);
      return { success: true, data: trend };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch transaction trend');
    }
  },
);

/**
 * Retrieves transaction breakdown by category with percentages.
 * @param dateFilter - An optional object with startDate and endDate to filter the data.
 * @returns A promise that resolves to an `ActionResult` containing the category breakdown.
 */
export const getTransactionCategoryBreakdown = withTenantPermission<
  { startDate?: Date; endDate?: Date } | undefined,
  TransactionCategoryBreakdown[]
>('canReadTransactions', async (ctx, dateFilter) => {
  try {
    const breakdown = await transactionRepo.getCategoryBreakdown(ctx.tenantId, dateFilter);
    return { success: true, data: breakdown };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch category breakdown');
  }
});

/**
 * Retrieves a list of top transaction categories based on total amount.
 * @param limit - The maximum number of categories to retrieve. Defaults to 5.
 * @returns A promise that resolves to an `ActionResult` containing an array of top categories.
 */
export const getTopTransactionCategories = withTenantPermission<
  number | undefined,
  TopTransactionCategory[]
>('canReadTransactions', async (ctx, limit) => {
  try {
    const topCategories = await transactionRepo.getTopCategories(limit ?? 5, ctx.tenantId);
    return { success: true, data: topCategories };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch top categories');
  }
});
