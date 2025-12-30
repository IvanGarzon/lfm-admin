/**
 * Task Executions API Route
 * GET /api/tasks/[id]/executions - Get execution history for a task
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TaskExecutionRepository } from '@/repositories/task-execution-repository';
import { ExecutionStatus } from '@/prisma/client';

const executionRepo = new TaskExecutionRepository(prisma);

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);

    // Extract pagination and filters
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const status = searchParams.get('status') as ExecutionStatus | undefined;

    const executions = await executionRepo.findByTaskId(id, {
      limit,
      offset,
      status,
    });

    // Get statistics
    const stats = await executionRepo.getStats(id);

    return NextResponse.json({
      success: true,
      data: executions,
      stats,
      pagination: {
        limit,
        offset,
        count: executions.length,
      },
    });
  } catch (error) {
    console.error('Failed to fetch executions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch executions',
      },
      { status: 500 },
    );
  }
}
