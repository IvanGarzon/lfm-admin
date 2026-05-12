'use server';

import { z } from 'zod';
import { uploadFileToS3, deleteFileFromS3, generateS3Key, getS3Url, s3Client } from '@/lib/s3';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/lib/file-constants';
import { handleActionError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { revalidatePath } from 'next/cache';
import { env } from '@/env';
import { withTenantPermission } from '@/lib/action-auth';
import { findQuoteById } from '@/db/quotes/queries';

export const uploadFile = withTenantPermission<
  FormData,
  { s3Key: string; s3Url: string; fileName: string; fileSize: number; mimeType: string }
>('canManageQuotes', async (ctx, formData) => {
  try {
    const fileEntry = formData.get('file');
    const quoteIdEntry = formData.get('quoteId');

    if (!fileEntry || !(fileEntry instanceof File)) {
      return { success: false, error: 'No file provided' };
    }

    if (!quoteIdEntry || typeof quoteIdEntry !== 'string') {
      return { success: false, error: 'No quoteId provided' };
    }

    const file = fileEntry;
    const quoteId = quoteIdEntry;

    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File exceeds the ${MAX_FILE_SIZE / 1024 / 1024}MB size limit`
      };
    }

    // Validate ownership when quoteId is a real entity ID (not a generic folder identifier)
    if (z.string().cuid().safeParse(quoteId).success) {
      const quote = await findQuoteById(prisma, quoteId, ctx.tenantId);
      if (!quote) {
        return { success: false, error: 'Quote not found' };
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const isTextFile = file.type === 'text/plain';
    const isAllowedType = ALLOWED_MIME_TYPES.some((type) => type === file.type);

    let result;
    if (isTextFile || isAllowedType) {
      if (isTextFile) {
        const s3Key = generateS3Key('quotes', quoteId, file.name, 'attachments');
        const command = new PutObjectCommand({
          Bucket: env.AWS_S3_BUCKET_NAME,
          Key: s3Key,
          Body: buffer,
          ContentType: file.type
        });
        await s3Client.send(command);
        result = { s3Key, s3Url: getS3Url(s3Key) };
      } else {
        result = await uploadFileToS3({
          file: buffer,
          fileName: file.name,
          mimeType: file.type,
          resourceType: 'quotes',
          resourceId: quoteId,
          subPath: 'attachments',
          metadata: { quoteId }
        });
      }
    } else {
      return {
        success: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}, text/plain (test only)`
      };
    }

    logger.info('File uploaded successfully', {
      context: 'file-upload',
      metadata: {
        userId: ctx.userId,
        fileName: file.name,
        fileSize: file.size,
        s3Key: result.s3Key
      }
    });

    revalidatePath('/tools/files');
    revalidatePath('/finances/quotes');

    return {
      success: true,
      data: {
        s3Key: result.s3Key,
        s3Url: result.s3Url,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type
      }
    };
  } catch (error) {
    return handleActionError(error, 'Failed to upload file', {
      action: 'uploadFile',
      userId: ctx.userId
    });
  }
});

export const deleteFile = withTenantPermission<string, { message: string }>(
  'canManageQuotes',
  async (ctx, s3Key) => {
    try {
      if (!s3Key) {
        return { success: false, error: 'No s3Key provided' };
      }

      await deleteFileFromS3(s3Key);

      logger.info('File deleted successfully', {
        context: 'file-delete',
        metadata: {
          userId: ctx.userId,
          s3Key
        }
      });

      revalidatePath('/tools/files');
      revalidatePath('/finances/quotes');
      revalidatePath('/finances/invoices');

      return {
        success: true,
        data: { message: 'File deleted successfully' }
      };
    } catch (error) {
      return handleActionError(error, 'Failed to delete file', {
        action: 'deleteFile',
        userId: ctx.userId,
        s3Key
      });
    }
  }
);
