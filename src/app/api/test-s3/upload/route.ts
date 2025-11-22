import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToS3, ALLOWED_MIME_TYPES } from '@/lib/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, generateS3Key, getS3Url } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const quoteId = formData.get('quoteId') as string;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (!quoteId) {
      return NextResponse.json({ success: false, error: 'No quoteId provided' }, { status: 400 });
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // For test endpoint, allow text/plain for testing purposes
    const isTextFile = file.type === 'text/plain';
    const isAllowedType = ALLOWED_MIME_TYPES.includes(file.type as any);

    let result;
    if (isTextFile || isAllowedType) {
      // Direct upload for text files (bypassing validation) or use standard upload for allowed types
      if (isTextFile) {
        const s3Key = generateS3Key('quotes', quoteId, file.name, 'attachments');
        const command = new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
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
      return NextResponse.json(
        {
          success: false,
          error: `File type ${file.type} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}, text/plain (test only)`,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      s3Key: result.s3Key,
      s3Url: result.s3Url,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      },
      { status: 500 },
    );
  }
}
