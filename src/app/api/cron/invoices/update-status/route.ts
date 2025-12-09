import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InvoiceStatus } from '@/prisma/client';
import { logger } from '@/lib/logger';
import { env } from '@/env';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const today = new Date();
    // find invoices that are PENDING and dueDate is strictly before today
    // Note: dueDate is often just a date (at 00:00:00). 
    // If dueDate is "2023-10-10", and now is "2023-10-10T12:00:00", is it overdue?
    // Usually overdue means "day after due date". 
    // So we look for dueDate < today (start of today).
    
    // We'll use start of today for comparison.
    // However, Prisma Date objects might have time components depending on input. 
    // The schema says @db.Date, so usually time is truncated.
    
    // Logic: If Today is Oct 11, and DueDate was Oct 10, it is overdue.
    // So dueDate < Today (Oct 11 00:00:00)
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const result = await prisma.invoice.updateMany({
      where: {
        status: InvoiceStatus.PENDING,
        dueDate: {
          lt: startOfToday,
        },
        deletedAt: null,
      },
      data: {
        status: InvoiceStatus.OVERDUE,
        updatedAt: new Date(),
      },
    });

    logger.info('Cron job: Updated overdue invoices', {
      context: 'CronJob',
      metadata: { count: result.count },
    });

    return NextResponse.json({
      success: true,
      message: `Updated ${result.count} overdue invoices`,
      count: result.count,
    });
  } catch (error) {
    logger.error('Cron job failed', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
