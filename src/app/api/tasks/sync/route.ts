/**
 * Task Sync API Route
 * POST /api/tasks/sync - Manually sync task definitions to database
 */

import { NextResponse } from 'next/server';
import { syncTasksToDatabase } from '@/services/tasks/task-registry.service';
import { tasks } from '@/tasks';

export async function POST(request: Request) {
  try {
    const result = await syncTasksToDatabase(tasks);

    return NextResponse.json({
      success: true,
      message: 'Tasks synced successfully',
      data: result,
    });
  } catch (error) {
    console.error('Failed to sync tasks:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync tasks',
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  // Support GET for easy browser testing
  return POST(request);
}
