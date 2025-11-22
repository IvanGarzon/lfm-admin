import { NextResponse } from 'next/server';

export async function GET() {
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

    return NextResponse.json({
      success: true,
      healthy: s3Healthy,
      endpoint,
      services: data.services,
      version: data.version,
      edition: data.edition,
    });
  } catch (error) {
    console.error('LocalStack health check error:', error);
    return NextResponse.json(
      {
        success: false,
        healthy: false,
        error: error instanceof Error ? error.message : 'Failed to connect to LocalStack',
      },
      { status: 500 },
    );
  }
}
