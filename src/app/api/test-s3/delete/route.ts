import { NextRequest, NextResponse } from 'next/server';
import { deleteFileFromS3 } from '@/lib/s3';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { s3Key } = body;

    if (!s3Key) {
      return NextResponse.json({ success: false, error: 'No s3Key provided' }, { status: 400 });
    }

    // Delete from S3
    await deleteFileFromS3(s3Key);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      },
      { status: 500 },
    );
  }
}
