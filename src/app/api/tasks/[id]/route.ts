/**
 * Task Detail API Routes
 * GET /api/tasks/[id] - Get task details with statistics
 * PUT /api/tasks/[id] - Update task configuration
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ScheduledTaskRepository } from '@/repositories/scheduled-task-repository';

const taskRepo = new ScheduledTaskRepository(prisma);

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const task = await taskRepo.findByIdWithStats(id);

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task not found',
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Failed to fetch task:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch task',
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();

    // Validate that task exists
    const existing = await taskRepo.findById(id);
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task not found',
        },
        { status: 404 },
      );
    }

    // Extract updatable fields
    const { isEnabled, cronSchedule, retries, concurrencyLimit, timeout, metadata } = body;

    const updated = await taskRepo.update(id, {
      ...(isEnabled !== undefined && { isEnabled }),
      ...(cronSchedule !== undefined && { cronSchedule }),
      ...(retries !== undefined && { retries }),
      ...(concurrencyLimit !== undefined && { concurrencyLimit }),
      ...(timeout !== undefined && { timeout }),
      ...(metadata !== undefined && { metadata }),
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Failed to update task:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update task',
      },
      { status: 500 },
    );
  }
}
