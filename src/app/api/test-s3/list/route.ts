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

      // Extract quote ID from new structure: quotes/[QUOTE_ID]/attachments/... or quotes/[QUOTE_ID]/items/...
      const quoteId = keyParts[0] === 'quotes' && keyParts.length > 1 ? keyParts[1] : '';

      return {
        key: item.Key || '',
        size: item.Size || 0,
        lastModified: item.LastModified?.toISOString() || '',
        fileName: item.Key?.split('/').pop() || '',
        folder: folder, // Full folder path
        type: item.Key?.includes('/items/') ? 'item' : 'quote', // Detect type
        quoteId: quoteId, // Extract quote ID from path
      };
    });

    return NextResponse.json({
      success: true,
      files,
      count: files.length,
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
