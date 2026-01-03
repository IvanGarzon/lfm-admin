'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { TransactionRepository } from '@/repositories/transaction-repository';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
  type CreateTransactionInput,
  type UpdateTransactionInput,
} from '@/schemas/transactions';
import type { ActionResult } from '@/types/actions';

const transactionRepo = new TransactionRepository(prisma);

/**
 * Creates a new transaction with the provided data.
 * @param data - The input data for creating the transaction.
 * @returns A promise that resolves to an `ActionResult` with the new transaction's ID.
 */
export async function createTransaction(
  data: CreateTransactionInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const validatedData = CreateTransactionSchema.parse(data);

    const transaction = await transactionRepo.createTransaction(validatedData);

    logger.info('Transaction created', {
      context: 'createTransaction',
      metadata: {
        type: transaction.type,
        amount: transaction.amount.toString(),
      },
    });

    revalidatePath('/finances/transactions');

    return {
      success: true,
      data: { id: transaction.id },
    };
  } catch (error) {
    return handleActionError(error, 'Failed to create transaction');
  }
}

/**
 * Updates an existing transaction with the provided data.
 * @param data - The input data for updating the transaction.
 * @returns A promise that resolves to an `ActionResult` with the updated transaction's ID.
 */
export async function updateTransaction(
  data: UpdateTransactionInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const validatedData = UpdateTransactionSchema.parse(data);
    const existing = await transactionRepo.findById(validatedData.id);

    if (!existing) {
      return { success: false, error: 'Transaction not found' };
    }

    const transaction = await transactionRepo.updateTransaction(validatedData.id, validatedData);

    logger.info('Transaction updated', {
      context: 'updateTransaction',
      metadata: {},
    });

    revalidatePath('/finances/transactions');
    revalidatePath(`/finances/transactions/${transaction.id}`);

    return { success: true, data: { id: transaction.id } };
  } catch (error) {
    return handleActionError(error, 'Failed to update transaction');
  }
}

/**
 * Deletes a transaction.
 * @param id - The ID of the transaction to delete.
 * @returns A promise that resolves to an `ActionResult` with success status.
 */
export async function deleteTransaction(id: string): Promise<ActionResult<{ success: true }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const existing = await transactionRepo.findById(id);
    if (!existing) {
      return { success: false, error: 'Transaction not found' };
    }

    await transactionRepo.deleteTransaction(id);

    logger.info('Transaction deleted', {
      context: 'deleteTransaction',
      metadata: {},
    });

    revalidatePath('/finances/transactions');

    return { success: true, data: { success: true } };
  } catch (error) {
    return handleActionError(error, 'Failed to delete transaction');
  }
}
