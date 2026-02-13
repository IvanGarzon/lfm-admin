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

/**
 * Uploads an attachment for a transaction.
 * @param transactionId - The ID of the transaction.
 * @param formData - The form data containing the file.
 * @returns A promise that resolves to an `ActionResult` with the attachment data.
 */
export async function uploadTransactionAttachment(
  transactionId: string,
  formData: FormData,
): Promise<
  ActionResult<{
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    s3Url: string;
  }>
> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const { uploadFileToS3 } = await import('@/lib/s3');
    const { ALLOWED_MIME_TYPES } = await import('@/lib/file-constants');

    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Validate file
    if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
      return { success: false, error: 'Invalid file type' };
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    const { s3Key, s3Url } = await uploadFileToS3({
      file: buffer,
      fileName: file.name,
      mimeType: file.type,
      resourceType: 'transactions',
      resourceId: transactionId,
      subPath: 'attachments',
    });

    // Save to database
    const attachment = await prisma.transactionAttachment.create({
      data: {
        transactionId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        s3Key,
        s3Url,
        uploadedBy: session.user.id,
      },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        s3Url: true,
      },
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
}

/**
 * Deletes an attachment from a transaction.
 * @param attachmentId - The ID of the attachment to delete.
 * @returns A promise that resolves to an `ActionResult`.
 */
export async function deleteTransactionAttachment(
  attachmentId: string,
): Promise<ActionResult<{ success: boolean }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const { deleteFileFromS3 } = await import('@/lib/s3');

    // Get attachment details
    const attachment = await prisma.transactionAttachment.findUnique({
      where: { id: attachmentId },
      select: { s3Key: true, transactionId: true, fileName: true },
    });

    if (!attachment) {
      return { success: false, error: 'Attachment not found' };
    }

    // Delete from S3
    await deleteFileFromS3(attachment.s3Key);

    // Delete from database
    await prisma.transactionAttachment.delete({
      where: { id: attachmentId },
    });

    logger.info('Transaction attachment deleted', {
      context: 'deleteTransactionAttachment',
      metadata: { attachmentId, fileName: attachment.fileName },
    });

    revalidatePath('/finances/transactions');

    return { success: true, data: { success: true } };
  } catch (error) {
    return handleActionError(error, 'Failed to delete attachment');
  }
}
