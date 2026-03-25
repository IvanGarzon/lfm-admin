'use server';

import { auth } from '@/auth';
import { getSignedDownloadUrl, s3Client } from '@/lib/s3';
import { handleActionError } from '@/lib/error-handler';
import type { ActionResult } from '@/types/actions';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';

interface S3File {
  key: string;
  size: number;
  lastModified: string;
  fileName: string;
  folder: string;
  resourceType: string;
  resourceId: string;
  subPath: string;
  fileType: string;
}

interface FileSummary {
  resourceType: string;
  fileType: string;
  count: number;
  totalSize: number;
}

/**
 * Lists all files in S3 storage with metadata and statistics.
 * Returns detailed information about each file including resource type, path, and size.
 * @returns A promise that resolves to an `ActionResult` containing files array, count, and summary statistics.
 */
export async function listFiles(): Promise<
  ActionResult<{
    files: S3File[];
    count: number;
    summary: FileSummary[];
  }>
> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;

    if (!bucketName) {
      return { success: false, error: 'Bucket name not configured' };
    }

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
    });

    const response = await s3Client.send(command);

    const files = (response.Contents || []).map((item) => {
      const keyParts = item.Key?.split('/') || [];
      const folder = keyParts.length > 1 ? keyParts.slice(0, -1).join('/') : '';

      let resourceType = '';
      let resourceId = '';
      let subPath = '';
      let fileType = 'unknown';

      if (keyParts.length >= 2) {
        resourceType = keyParts[0]; // 'quotes', 'invoices', etc.
        resourceId = keyParts[1]; // quote ID, invoice ID, etc.

        if (keyParts.length > 2) {
          subPath = keyParts.slice(2, -1).join('/');
        }

        // Determine file type based on path structure
        if (resourceType === 'quotes') {
          if (subPath.includes('items')) {
            fileType = 'quote-item-attachment';
          } else if (subPath.includes('attachments')) {
            fileType = 'quote-attachment';
          }
        } else if (resourceType === 'invoices') {
          if (subPath.includes('pdfs')) {
            fileType = 'invoice-pdf';
          } else if (subPath.includes('attachments')) {
            fileType = 'invoice-attachment';
          }
        }
      }

      return {
        key: item.Key || '',
        size: item.Size || 0,
        lastModified: item.LastModified?.toISOString() || '',
        fileName: item.Key?.split('/').pop() || '',
        folder: folder,
        resourceType: resourceType,
        resourceId: resourceId,
        subPath: subPath,
        fileType: fileType,
      };
    });

    // Generate summary statistics
    const summary = files.reduce(
      (acc, file) => {
        const key = `${file.resourceType}/${file.fileType}`;
        if (!acc[key]) {
          acc[key] = {
            resourceType: file.resourceType,
            fileType: file.fileType,
            count: 0,
            totalSize: 0,
          };
        }
        acc[key].count++;
        acc[key].totalSize += file.size;
        return acc;
      },
      {} as Record<string, FileSummary>,
    );

    return {
      success: true,
      data: {
        files,
        count: files.length,
        summary: Object.values(summary),
      },
    };
  } catch (error) {
    return handleActionError(error, 'Failed to list files', {
      action: 'listFiles',
      userId: session.user.id,
    });
  }
}

/**
 * Generates a signed download URL for a file in S3 storage.
 * The URL expires in 24 hours for security.
 * @param s3Key - The S3 key of the file to download.
 * @returns A promise that resolves to an `ActionResult` containing the signed URL and expiration time.
 */
export async function getFileDownloadUrl(
  s3Key: string,
): Promise<ActionResult<{ url: string; expiresIn: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    if (!s3Key) {
      return { success: false, error: 'No s3Key provided' };
    }

    // Generate signed URL (expires in 24 hours)
    const url = await getSignedDownloadUrl(s3Key);

    return {
      success: true,
      data: {
        url,
        expiresIn: '24 hours',
      },
    };
  } catch (error) {
    return handleActionError(error, 'Failed to generate download URL', {
      action: 'getFileDownloadUrl',
      userId: session.user.id,
      s3Key,
    });
  }
}

/**
 * Checks the health status of the S3 storage service.
 * Useful for development with LocalStack or monitoring production S3.
 * @returns A promise that resolves to an `ActionResult` with health status and service information.
 */
export async function checkStorageHealth(): Promise<
  ActionResult<{
    healthy: boolean;
    endpoint: string;
    services?: Record<string, string>;
    version?: string;
    edition?: string;
  }>
> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Only ADMIN can check storage health
  if (session.user.role !== 'ADMIN') {
    return { success: false, error: 'Forbidden: Only admins can check storage health' };
  }

  try {
    // Check if LocalStack is running by trying to connect to its health endpoint
    const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';

    const response = await fetch(`${endpoint}/_localstack/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    // Check if S3 is available or running
    const s3Status = data.services?.s3;
    const s3Healthy = s3Status === 'available' || s3Status === 'running';

    return {
      success: true,
      data: {
        healthy: s3Healthy,
        endpoint,
        services: data.services,
        version: data.version,
        edition: data.edition,
      },
    };
  } catch (error) {
    return handleActionError(error, 'Failed to check storage health', {
      action: 'checkStorageHealth',
      userId: session.user.id,
    });
  }
}
