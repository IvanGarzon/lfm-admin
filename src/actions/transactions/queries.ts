'use server';

import { auth } from '@/auth';
import { SearchParams } from 'nuqs/server';

import { TransactionRepository } from '@/repositories/transaction-repository';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import type { ActionResult } from '@/types/actions';
import type {
  Transaction,
  TransactionPagination,
  TransactionStatistics,
} from '@/features/finances/transactions/types';
import { searchParamsCache } from '@/filters/transactions/transactions-filters';

const transactionRepo = new TransactionRepository(prisma);

/**
 * Retrieves a paginated list of transactions based on specified search and filter criteria.
 * @param searchParams - The search parameters for filtering, sorting, and pagination.
 * @returns A promise that resolves to an `ActionResult` containing the paginated transaction data.
 */
export async function getTransactions(
  searchParams: SearchParams,
): Promise<ActionResult<TransactionPagination>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // TODO: Add transaction permissions to permissions.ts
    // requirePermission(session.user, 'canReadTransactions');

    const filters = searchParamsCache.parse(searchParams);
    const result = await transactionRepo.searchAndPaginate(filters);

    return { success: true, data: result };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch transactions');
  }
}

/**
 * Retrieves a single transaction by its unique identifier.
 * @param id - The ID of the transaction to retrieve.
 * @returns A promise that resolves to an `ActionResult` containing the transaction details.
 */
export async function getTransactionById(id: string): Promise<ActionResult<Transaction>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const transaction = await transactionRepo.findByIdWithDetails(id);

    if (!transaction) {
      return { success: false, error: 'Transaction not found' };
    }

    // Convert Decimal to number for client components and ensure type compatibility
    const serializedTransaction: Transaction = {
      ...transaction,
      amount: Number(transaction.amount),
      categories: transaction.categories || [],
      attachments: transaction.attachments || [],
      invoice: transaction.invoice || null,
    };

    return { success: true, data: serializedTransaction };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch transaction');
  }
}

/**
 * Retrieves statistics about transactions.
 * @param dateFilter - An optional object with startDate and endDate to filter the statistics.
 * @returns A promise that resolves to an `ActionResult` containing the transaction statistics.
 */
export async function getTransactionStatistics(dateFilter?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<ActionResult<TransactionStatistics>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const stats = await transactionRepo.getStatistics(dateFilter);
    return { success: true, data: stats };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch transaction statistics');
  }
}

/**
 * Retrieves all active transaction categories.
 * @returns A promise that resolves to an `ActionResult` containing the list of active categories.
 */
export async function getTransactionCategories(): Promise<
  ActionResult<Array<{ id: string; name: string; description: string | null }>>
> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const categories = await prisma.transactionCategory.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });

    return { success: true, data: categories };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch transaction categories');
  }
}
