'use server';

import { getSignedDownloadUrl, s3Client } from '@/lib/s3';
import { handleActionError } from '@/lib/error-handler';
import { withAuth } from '@/lib/action-auth';
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

export const listFiles = withAuth<void, { files: S3File[]; count: number; summary: FileSummary[] }>(
  async (_session) => {
    try {
      const bucketName = process.env.AWS_S3_BUCKET_NAME;

      if (!bucketName) {
        return { success: false, error: 'Bucket name not configured' };
      }

      const command = new ListObjectsV2Command({ Bucket: bucketName });
      const response = await s3Client.send(command);

      const files = (response.Contents || []).map((item) => {
        const keyParts = item.Key?.split('/') || [];
        const folder = keyParts.length > 1 ? keyParts.slice(0, -1).join('/') : '';

        let resourceType = '';
        let resourceId = '';
        let subPath = '';
        let fileType = 'unknown';

        if (keyParts.length >= 2) {
          resourceType = keyParts[0];
          resourceId = keyParts[1];

          if (keyParts.length > 2) {
            subPath = keyParts.slice(2, -1).join('/');
          }

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
          folder,
          resourceType,
          resourceId,
          subPath,
          fileType,
        };
      });

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
      return handleActionError(error, 'Failed to list files', { action: 'listFiles' });
    }
  },
);

export const getFileDownloadUrl = withAuth<string, { url: string; expiresIn: string }>(
  async (_session, s3Key) => {
    try {
      if (!s3Key) {
        return { success: false, error: 'No s3Key provided' };
      }

      const url = await getSignedDownloadUrl(s3Key);

      return {
        success: true,
        data: { url, expiresIn: '24 hours' },
      };
    } catch (error) {
      return handleActionError(error, 'Failed to generate download URL', {
        action: 'getFileDownloadUrl',
        s3Key,
      });
    }
  },
);

export const checkStorageHealth = withAuth<
  void,
  {
    healthy: boolean;
    endpoint: string;
    services?: Record<string, string>;
    version?: string;
    edition?: string;
  }
>(async (session) => {
  if (session.user.role !== 'ADMIN') {
    return { success: false, error: 'Forbidden: Only admins can check storage health' };
  }

  try {
    const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';

    const response = await fetch(`${endpoint}/_localstack/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

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
    });
  }
});
