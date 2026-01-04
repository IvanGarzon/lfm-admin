'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
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

/**
 * Creates a new transaction category.
 * @param name - The name of the category to create.
 * @returns A promise that resolves to an `ActionResult` with the new category data.
 */
export async function createTransactionCategory(
  name: string,
): Promise<ActionResult<{ id: string; name: string; description: string | null }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Validate category name
    const schema = z
      .string()
      .trim()
      .min(1, 'Category name is required')
      .max(50, 'Category name is too long');
    const validatedName = schema.parse(name);

    // Check if category already exists
    const existing = await prisma.transactionCategory.findFirst({
      where: {
        name: {
          equals: validatedName,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      return {
        success: true,
        data: {
          id: existing.id,
          name: existing.name,
          description: existing.description,
        },
      };
    }

    // Create new category
    const category = await prisma.transactionCategory.create({
      data: {
        name: validatedName,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    logger.info('Transaction category created', {
      context: 'createTransactionCategory',
      metadata: { categoryName: category.name },
    });

    revalidatePath('/finances/transactions');

    return { success: true, data: category };
  } catch (error) {
    return handleActionError(error, 'Failed to create transaction category');
  }
}
