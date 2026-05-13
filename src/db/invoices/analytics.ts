import { InvoiceStatus, Prisma, PrismaClient } from '@/prisma/client';
import { withDatabaseRetry } from '@/lib/retry';

import type {
  InvoiceStatistics,
  RevenueTrend,
  TopCustomerDebtor,
} from '@/features/finances/invoices/types';

// -- Private helpers ------------------------------------------------------------

async function getBasicStats(
  prisma: PrismaClient,
  where: Prisma.InvoiceWhereInput,
): Promise<{ total: number; totalRevenue: number; pendingRevenue: number }> {
  const data = await prisma.invoice.groupBy({
    by: ['status'],
    where,
    _count: true,
    _sum: { amount: true },
  });

  let totalRevenue = 0;
  let pendingRevenue = 0;
  let total = 0;

  data.forEach((group) => {
    total += group._count;
    const amount = Number(group._sum.amount ?? 0);
    if (group.status === InvoiceStatus.PAID) {
      totalRevenue = amount;
    } else if (
      group.status === InvoiceStatus.PENDING ||
      group.status === InvoiceStatus.OVERDUE ||
      group.status === InvoiceStatus.PARTIALLY_PAID
    ) {
      pendingRevenue += amount;
    }
  });

  return { total, totalRevenue, pendingRevenue };
}

function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

// -- Public functions -----------------------------------------------------------

/**
 * Calculate invoice statistics including counts by status, revenue, and averages.
 * Optimised to run only 2 database queries instead of 5.
 * @param prisma - The Prisma client instance
 * @param tenantId - The tenant ID to scope all queries
 * @param dateFilter - Optional date range filter for the statistics
 * @param dateFilter.startDate - Start date for filtering invoices
 * @param dateFilter.endDate - End date for filtering invoices
 * @returns A promise that resolves to invoice statistics object
 */
export async function getInvoiceStatistics(
  prisma: PrismaClient,
  tenantId: string,
  dateFilter?: {
    startDate?: Date;
    endDate?: Date;
  },
): Promise<InvoiceStatistics> {
  const whereClause: Prisma.InvoiceWhereInput = {
    tenantId,
    deletedAt: null,
  };

  // Add date filter if provided
  if (dateFilter?.startDate || dateFilter?.endDate) {
    whereClause.issuedDate = {};
    if (dateFilter.startDate) {
      whereClause.issuedDate.gte = dateFilter.startDate;
    }
    if (dateFilter.endDate) {
      whereClause.issuedDate.lte = dateFilter.endDate;
    }
  }

  // Determine previous period for growth comparison
  let previousWhereClause: Prisma.InvoiceWhereInput | null = null;
  if (dateFilter?.startDate && dateFilter?.endDate) {
    const duration = dateFilter.endDate.getTime() - dateFilter.startDate.getTime();
    previousWhereClause = {
      tenantId,
      deletedAt: null,
      issuedDate: {
        gte: new Date(dateFilter.startDate.getTime() - duration),
        lte: new Date(dateFilter.endDate.getTime() - duration),
      },
    };
  } else if (!dateFilter?.startDate && !dateFilter?.endDate) {
    // Default: Compare this month to last month
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    previousWhereClause = {
      tenantId,
      deletedAt: null,
      issuedDate: {
        gte: firstDayLastMonth,
        lt: firstDayThisMonth,
      },
    };
  }

  // Build raw SQL query for average (money type doesn't support avg in Prisma aggregate)
  let avgQuery = Prisma.sql`
    SELECT AVG(amount::numeric)::float as avg
    FROM invoices
    WHERE deleted_at IS NULL
    AND tenant_id = ${tenantId}
    AND status::text = ${InvoiceStatus.PAID}
  `;

  if (dateFilter?.startDate) {
    avgQuery = Prisma.sql`${avgQuery} AND issued_date >= ${dateFilter.startDate}`;
  }
  if (dateFilter?.endDate) {
    avgQuery = Prisma.sql`${avgQuery} AND issued_date <= ${dateFilter.endDate}`;
  }

  // Run queries in parallel
  const [statusGroupData, avgInvoiceData, prevData, revenueTrend, topDebtors] =
    await withDatabaseRetry(() =>
      Promise.all([
        prisma.invoice.groupBy({
          by: ['status'],
          where: whereClause,
          _count: true,
          _sum: { amount: true },
        }),
        prisma.$queryRaw<[{ avg: number }]>(avgQuery),
        previousWhereClause ? getBasicStats(prisma, previousWhereClause) : Promise.resolve(null),
        getInvoiceMonthlyRevenueTrend(prisma, tenantId, 12),
        getInvoiceTopDebtors(prisma, tenantId, 5),
      ]),
    );

  // Process current period data
  let totalRevenue = 0;
  let pendingRevenue = 0;
  let totalCount = 0;

  const stats: InvoiceStatistics = {
    total: 0,
    draft: 0,
    pending: 0,
    paid: 0,
    cancelled: 0,
    overdue: 0,
    partiallyPaid: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    avgInvoiceValue: Number(avgInvoiceData[0]?.avg ?? 0),
    revenueTrend,
    topDebtors,
  };

  statusGroupData.forEach((group) => {
    totalCount += group._count;
    const amount = Number(group._sum.amount ?? 0);

    if (group.status === InvoiceStatus.PAID) {
      totalRevenue = amount;
    } else if (
      group.status === InvoiceStatus.PENDING ||
      group.status === InvoiceStatus.OVERDUE ||
      group.status === InvoiceStatus.PARTIALLY_PAID
    ) {
      pendingRevenue += amount;
    }

    switch (group.status) {
      case InvoiceStatus.DRAFT:
        stats.draft = group._count;
        break;
      case InvoiceStatus.PENDING:
        stats.pending = group._count;
        break;
      case InvoiceStatus.PAID:
        stats.paid = group._count;
        break;
      case InvoiceStatus.CANCELLED:
        stats.cancelled = group._count;
        break;
      case InvoiceStatus.OVERDUE:
        stats.overdue = group._count;
        break;
      case InvoiceStatus.PARTIALLY_PAID:
        stats.partiallyPaid = group._count;
        break;
      default:
        break;
    }
  });

  stats.total = totalCount;
  stats.totalRevenue = totalRevenue;
  stats.pendingRevenue = pendingRevenue;

  // Calculate growth metrics
  if (prevData) {
    stats.totalRevenueGrowth = calculateGrowth(totalRevenue, prevData.totalRevenue);
    stats.pendingRevenueGrowth = calculateGrowth(pendingRevenue, prevData.pendingRevenue);
    stats.invoiceCountGrowth = calculateGrowth(totalCount, prevData.total);
  }

  return stats;
}

/**
 * Get monthly revenue trend for the last N months.
 * @param prisma - The Prisma client instance
 * @param tenantId - The tenant ID to scope all queries
 * @param limit - Number of months to retrieve. Defaults to 12.
 * @returns A promise that resolves to an array of monthly revenue trend data
 */
export async function getInvoiceMonthlyRevenueTrend(
  prisma: PrismaClient,
  tenantId: string,
  limit: number = 12,
): Promise<RevenueTrend[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await withDatabaseRetry(() =>
    prisma.$queryRaw<
      { month: string; month_num: number; year: number; total: number; paid: number }[]
    >(Prisma.sql`
      SELECT
        to_char(issued_date, 'Mon') as month,
        extract(month from issued_date) as month_num,
        extract(year from issued_date) as year,
        SUM(amount::numeric)::float as total,
        SUM(CASE WHEN status::text = ${InvoiceStatus.PAID} THEN amount::numeric ELSE 0 END)::float as paid
      FROM invoices
      WHERE deleted_at IS NULL
      AND tenant_id = ${tenantId}
      GROUP BY year, month_num, month
      ORDER BY year DESC, month_num DESC
      LIMIT ${limit}
    `),
  );

  return data
    .map((item) => ({
      month: `${item.month} ${item.year}`,
      total: item.total,
      paid: item.paid,
    }))
    .toReversed();
}

/**
 * Get top customers by outstanding balance.
 * @param prisma - The Prisma client instance
 * @param tenantId - The tenant ID to scope all queries
 * @param limit - Number of debtors to retrieve. Defaults to 5.
 * @returns A promise that resolves to an array of top customer debtors
 */
export async function getInvoiceTopDebtors(
  prisma: PrismaClient,
  tenantId: string,
  limit: number = 5,
): Promise<TopCustomerDebtor[]> {
  const data = await withDatabaseRetry(() =>
    prisma.$queryRaw<
      { customerId: string; customerName: string; amountDue: number; invoiceCount: number }[]
    >(Prisma.sql`
      SELECT
        c.id as "customerId",
        concat(c.first_name, ' ', c.last_name) as "customerName",
        SUM(i.amount::numeric - COALESCE((SELECT SUM(amount::numeric) FROM payments p WHERE p.invoice_id = i.id), 0))::float as "amountDue",
        COUNT(i.id)::int as "invoiceCount"
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      WHERE i.deleted_at IS NULL
      AND i.tenant_id = ${tenantId}
      AND i.status::text IN (${InvoiceStatus.PENDING}, ${InvoiceStatus.OVERDUE}, ${InvoiceStatus.PARTIALLY_PAID})
      GROUP BY c.id, "customerName"
      ORDER BY "amountDue" DESC
      LIMIT ${limit}
    `),
  );

  return data.map((item) => ({
    customerId: item.customerId,
    customerName: item.customerName,
    amountDue: item.amountDue,
    invoiceCount: item.invoiceCount,
  }));
}
