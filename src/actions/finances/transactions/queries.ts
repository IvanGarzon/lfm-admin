'use server';

import { SearchParams } from 'nuqs/server';

import { TransactionRepository } from '@/repositories/transaction-repository';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { withPermission } from '@/lib/action-auth';
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
export const getTransactions = withPermission<SearchParams, TransactionPagination>(
  'canReadTransactions',
  async (_session, searchParams) => {
    try {
      const filters = searchParamsCache.parse(searchParams);
      const result = await transactionRepo.searchAndPaginate(filters);
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
export const getTransactionById = withPermission<string, TransactionListItem>(
  'canReadTransactions',
  async (_session, id) => {
    try {
      const transaction = await transactionRepo.findByIdWithDetails(id);

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
export const getTransactionStatistics = withPermission<
  { startDate?: Date; endDate?: Date } | undefined,
  TransactionStatistics
>('canReadTransactions', async (_session, dateFilter) => {
  try {
    const stats = await transactionRepo.getStatistics(dateFilter);
    return { success: true, data: stats };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch transaction statistics');
  }
});

/**
 * Retrieves all active transaction categories.
 * @returns A promise that resolves to an `ActionResult` containing the list of active categories.
 */
export const getTransactionCategories = withPermission<
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
export const getTransactionTrend = withPermission<number | undefined, TransactionTrend[]>(
  'canReadTransactions',
  async (_session, limit) => {
    try {
      const trend = await transactionRepo.getMonthlyTransactionTrend(limit ?? 12);
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
export const getTransactionCategoryBreakdown = withPermission<
  { startDate?: Date; endDate?: Date } | undefined,
  TransactionCategoryBreakdown[]
>('canReadTransactions', async (_session, dateFilter) => {
  try {
    const breakdown = await transactionRepo.getCategoryBreakdown(dateFilter);
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
export const getTopTransactionCategories = withPermission<
  number | undefined,
  TopTransactionCategory[]
>('canReadTransactions', async (_session, limit) => {
  try {
    const topCategories = await transactionRepo.getTopCategories(limit ?? 5);
    return { success: true, data: topCategories };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch top categories');
  }
});
