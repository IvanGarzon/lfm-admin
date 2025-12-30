/**
 * Task Manual Execution API Route
 * POST /api/tasks/[id]/execute - Trigger a task manually
 */

import { NextResponse } from 'next/server';
import { triggerTaskManually } from '@/services/tasks/task-execution.service';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { userId } = body;

    const result = await triggerTaskManually(id, userId);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Task triggered successfully',
    });
  } catch (error) {
    console.error('Failed to trigger task:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to trigger task';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
