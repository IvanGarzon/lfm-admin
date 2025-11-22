import { NextRequest, NextResponse } from 'next/server';
import { getSignedDownloadUrl } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { s3Key } = body;

    if (!s3Key) {
      return NextResponse.json({ success: false, error: 'No s3Key provided' }, { status: 400 });
    }

    // Generate signed URL (expires in 24 hours)
    const url = await getSignedDownloadUrl(s3Key);

    return NextResponse.json({
      success: true,
      url,
      expiresIn: '24 hours',
    });
  } catch (error) {
    console.error('Download URL generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate download URL',
      },
      { status: 500 },
    );
  }
}
