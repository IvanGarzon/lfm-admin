'use server';

import { uploadFileToS3, deleteFileFromS3, generateS3Key, getS3Url, s3Client } from '@/lib/s3';
import { ALLOWED_MIME_TYPES } from '@/lib/file-constants';
import { handleActionError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { revalidatePath } from 'next/cache';
import { env } from '@/env';
import { withAuth } from '@/lib/action-auth';

export const uploadFile = withAuth<
  FormData,
  { s3Key: string; s3Url: string; fileName: string; fileSize: number; mimeType: string }
>(async (session, formData) => {
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
          ContentType: file.type,
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
          metadata: { quoteId },
        });
      }
    } else {
      return {
        success: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}, text/plain (test only)`,
      };
    }

    logger.info('File uploaded successfully', {
      context: 'file-upload',
      metadata: {
        userId: session.user.id,
        fileName: file.name,
        fileSize: file.size,
        s3Key: result.s3Key,
      },
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
        mimeType: file.type,
      },
    };
  } catch (error) {
    return handleActionError(error, 'Failed to upload file', {
      action: 'uploadFile',
      userId: session.user.id,
    });
  }
});

export const deleteFile = withAuth<string, { message: string }>(async (session, s3Key) => {
  if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
    return { success: false, error: 'Forbidden: Insufficient permissions to delete files' };
  }

  try {
    if (!s3Key) {
      return { success: false, error: 'No s3Key provided' };
    }

    await deleteFileFromS3(s3Key);

    logger.info('File deleted successfully', {
      context: 'file-delete',
      metadata: {
        userId: session.user.id,
        s3Key,
      },
    });

    revalidatePath('/tools/files');
    revalidatePath('/finances/quotes');
    revalidatePath('/finances/invoices');

    return {
      success: true,
      data: { message: 'File deleted successfully' },
    };
  } catch (error) {
    return handleActionError(error, 'Failed to delete file', {
      action: 'deleteFile',
      userId: session.user.id,
      s3Key,
    });
  }
});
