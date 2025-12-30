import { NextResponse } from 'next/server';
import { s3Client } from '@/lib/s3';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';

export async function GET() {
  try {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;

    if (!bucketName) {
      return NextResponse.json(
        { success: false, error: 'Bucket name not configured' },
        { status: 500 },
      );
    }

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      // Remove Prefix to list ALL files in the bucket
    });

    const response = await s3Client.send(command);

    const files = (response.Contents || []).map((item) => {
      const keyParts = item.Key?.split('/') || [];
      const folder = keyParts.length > 1 ? keyParts.slice(0, -1).join('/') : '';

      // Handle different S3 key structures:
      // New: [resourceType]/[resourceId]/[subPath]/[filename]
      // Old: quotes/[QUOTE_ID]/attachments/[filename] or quotes/[QUOTE_ID]/items/[ITEM_ID]/[filename]

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
      {} as Record<
        string,
        { resourceType: string; fileType: string; count: number; totalSize: number }
      >,
    );

    return NextResponse.json({
      success: true,
      files,
      count: files.length,
      summary: Object.values(summary),
    });
  } catch (error) {
    console.error('S3 list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list files',
      },
      { status: 500 },
    );
  }
}
