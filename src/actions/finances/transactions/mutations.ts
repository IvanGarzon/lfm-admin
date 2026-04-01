'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { TransactionRepository } from '@/repositories/transaction-repository';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { withPermission } from '@/lib/action-auth';
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
  type CreateTransactionInput,
  type UpdateTransactionInput,
} from '@/schemas/transactions';
import type { TransactionListItem } from '@/features/finances/transactions/types';
import { ALLOWED_MIME_TYPES } from '@/lib/file-constants';

const transactionRepo = new TransactionRepository(prisma);

/**
 * Creates a new transaction with the provided data.
 * @param data - The input data for creating the transaction.
 * @returns A promise that resolves to an `ActionResult` with the new transaction.
 */
export const createTransaction = withPermission<CreateTransactionInput, TransactionListItem>(
  'canManageTransactions',
  async (_session, data) => {
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

      return { success: true, data: transaction };
    } catch (error) {
      return handleActionError(error, 'Failed to create transaction');
    }
  },
);

/**
 * Updates an existing transaction with the provided data.
 * @param data - The input data for updating the transaction.
 * @returns A promise that resolves to an `ActionResult` with the updated transaction's ID.
 */
export const updateTransaction = withPermission<UpdateTransactionInput, { id: string }>(
  'canManageTransactions',
  async (_session, data) => {
    try {
      const validatedData = UpdateTransactionSchema.parse(data);
      const existing = await transactionRepo.findById(validatedData.id);
      if (!existing) {
        return { success: false, error: 'Transaction not found' };
      }

      const transaction = await transactionRepo.updateTransaction(validatedData.id, validatedData);
      if (!transaction) {
        return { success: false, error: 'Failed to update transaction' };
      }

      logger.info('Transaction updated', {
        context: 'updateTransaction',
        metadata: { transactionId: transaction.id },
      });

      revalidatePath('/finances/transactions');
      revalidatePath(`/finances/transactions/${transaction.id}`);

      return { success: true, data: { id: transaction.id } };
    } catch (error) {
      return handleActionError(error, 'Failed to update transaction');
    }
  },
);

/**
 * Deletes a transaction.
 * @param id - The ID of the transaction to delete.
 * @returns A promise that resolves to an `ActionResult` with success status.
 */
export const deleteTransaction = withPermission<string, { success: true }>(
  'canManageTransactions',
  async (_session, id) => {
    try {
      const existing = await transactionRepo.findById(id);
      if (!existing) {
        return { success: false, error: 'Transaction not found' };
      }

      await transactionRepo.deleteTransaction(id);

      logger.info('Transaction deleted', {
        context: 'deleteTransaction',
        metadata: { transactionId: id },
      });

      revalidatePath('/finances/transactions');

      return { success: true, data: { success: true } };
    } catch (error) {
      return handleActionError(error, 'Failed to delete transaction');
    }
  },
);

/**
 * Creates a new transaction category, or returns the existing one if the name already exists.
 * @param name - The category name.
 * @returns A promise that resolves to an `ActionResult` with the category data.
 */
export const createTransactionCategory = withPermission<
  string,
  { id: string; name: string; description: string | null }
>('canManageTransactions', async (_session, name) => {
  try {
    const schema = z
      .string()
      .trim()
      .min(1, 'Category name is required')
      .max(50, 'Category name is too long');
    const validatedName = schema.parse(name);

    const category = await transactionRepo.findOrCreateCategory(validatedName);

    logger.info('Transaction category created', {
      context: 'createTransactionCategory',
      metadata: { categoryName: category.name },
    });

    revalidatePath('/finances/transactions');

    return { success: true, data: category };
  } catch (error) {
    return handleActionError(error, 'Failed to create transaction category');
  }
});

/**
 * Uploads an attachment for a transaction.
 * Expects FormData with fields: `transactionId` (string) and `file` (File).
 * @param formData - The form data containing the file and transaction ID.
 * @returns A promise that resolves to an `ActionResult` with the attachment data.
 */
export const uploadTransactionAttachment = withPermission<
  FormData,
  { id: string; fileName: string; fileSize: number; mimeType: string; s3Url: string }
>('canManageTransactions', async (session, formData) => {
  try {
    const { uploadFileToS3 } = await import('@/lib/s3');

    const transactionId = formData.get('transactionId');
    const fileEntry = formData.get('file');

    if (typeof transactionId !== 'string' || !(fileEntry instanceof File)) {
      return { success: false, error: 'Missing required fields' };
    }

    const file: File = fileEntry;

    if (!ALLOWED_MIME_TYPES.some((type) => type === file.type)) {
      return { success: false, error: 'Invalid file type' };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { s3Key, s3Url } = await uploadFileToS3({
      file: buffer,
      fileName: file.name,
      mimeType: file.type,
      resourceType: 'transactions',
      resourceId: transactionId,
      subPath: 'attachments',
    });

    const attachment = await transactionRepo.createAttachment({
      transactionId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      s3Key,
      s3Url,
      uploadedBy: session.user.id,
    });

    logger.info('Transaction attachment uploaded', {
      context: 'uploadTransactionAttachment',
      metadata: { transactionId, fileName: file.name },
    });

    revalidatePath('/finances/transactions');

    return { success: true, data: attachment };
  } catch (error) {
    return handleActionError(error, 'Failed to upload attachment');
  }
});

/**
 * Deletes an attachment from a transaction.
 * @param attachmentId - The ID of the attachment to delete.
 * @returns A promise that resolves to an `ActionResult`.
 */
export const deleteTransactionAttachment = withPermission<string, { success: boolean }>(
  'canManageTransactions',
  async (_session, attachmentId) => {
    try {
      const { deleteFileFromS3 } = await import('@/lib/s3');

      const attachment = await transactionRepo.findAttachmentById(attachmentId);
      if (!attachment) {
        return { success: false, error: 'Attachment not found' };
      }

      await deleteFileFromS3(attachment.s3Key);
      await transactionRepo.deleteAttachment(attachmentId);

      logger.info('Transaction attachment deleted', {
        context: 'deleteTransactionAttachment',
        metadata: { attachmentId, fileName: attachment.fileName },
      });

      revalidatePath('/finances/transactions');

      return { success: true, data: { success: true } };
    } catch (error) {
      return handleActionError(error, 'Failed to delete attachment');
    }
  },
);
