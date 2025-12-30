/**
 * Tasks API Routes
 * GET /api/tasks - List all scheduled tasks with optional filters
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ScheduledTaskRepository } from '@/repositories/scheduled-task-repository';
import { TaskCategory, ScheduleType } from '@/prisma/client';

const taskRepo = new ScheduledTaskRepository(prisma);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract filters from query params
    const category = searchParams.get('category') as TaskCategory | undefined;
    const isEnabled = searchParams.get('isEnabled');
    const scheduleType = searchParams.get('scheduleType') as ScheduleType | undefined;

    const filters = {
      ...(category && { category }),
      ...(isEnabled !== null && isEnabled !== undefined && { isEnabled: isEnabled === 'true' }),
      ...(scheduleType && { scheduleType }),
    };

    const tasks = await taskRepo.findAll(filters);

    return NextResponse.json({
      success: true,
      data: tasks,
      count: tasks.length,
    });
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tasks',
      },
      { status: 500 },
    );
  }
}
