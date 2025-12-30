/**
 * Execution Detail API Route
 * GET /api/tasks/[id]/executions/[executionId] - Get detailed execution information
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TaskExecutionRepository } from '@/repositories/task-execution-repository';

const executionRepo = new TaskExecutionRepository(prisma);

export async function GET(
  request: Request,
  { params }: { params: { id: string; executionId: string } },
) {
  try {
    const { executionId } = params;

    const execution = await executionRepo.findById(executionId);

    if (!execution) {
      return NextResponse.json(
        {
          success: false,
          error: 'Execution not found',
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: execution,
    });
  } catch (error) {
    console.error('Failed to fetch execution:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch execution',
      },
      { status: 500 },
    );
  }
}
