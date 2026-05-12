import { Prisma, PrismaClient, QuoteStatus } from '@/prisma/client';

import type {
  QuoteStatistics,
  QuoteValueTrend,
  TopCustomerByQuotedValue,
  ConversionFunnelData,
  AverageTimeToDecision,
  StatsDateFilter
} from '@/features/finances/quotes/types';

// -- Private helpers ------------------------------------------------------------

function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
}

// -- Public functions -----------------------------------------------------------

/**
 * Get comprehensive statistics about quotes including counts by status, total values, and conversion rates.
 * Only counts the latest versions of quotes (quotes without child versions).
 * @param prisma - The Prisma client instance
 * @param tenantId - The tenant ID to scope all queries
 * @param dateFilter - Optional date range filter for the statistics
 * @param dateFilter.startDate - The start date (inclusive) for filtering quotes
 * @param dateFilter.endDate - The end date (inclusive) for filtering quotes
 * @returns A promise that resolves to statistics object with counts, values, and conversion rate
 */
export async function getQuoteStatistics(
  prisma: PrismaClient,
  tenantId: string,
  dateFilter?: { startDate?: Date; endDate?: Date }
): Promise<QuoteStatistics> {
  const whereClause: Prisma.QuoteWhereInput = {
    tenantId,
    deletedAt: null,
    isLatestVersion: true
  };

  if (dateFilter?.startDate || dateFilter?.endDate) {
    whereClause.issuedDate = {};
    if (dateFilter.startDate) {
      whereClause.issuedDate.gte = dateFilter.startDate;
    }

    if (dateFilter.endDate) {
      whereClause.issuedDate.lte = dateFilter.endDate;
    }
  }

  let previousWhereClause: Prisma.QuoteWhereInput | null = null;
  if (dateFilter?.startDate && dateFilter?.endDate) {
    const duration = dateFilter.endDate.getTime() - dateFilter.startDate.getTime();
    previousWhereClause = {
      tenantId,
      deletedAt: null,
      isLatestVersion: true,
      issuedDate: {
        gte: new Date(dateFilter.startDate.getTime() - duration),
        lte: new Date(dateFilter.endDate.getTime() - duration)
      }
    };
  } else if (!dateFilter?.startDate && !dateFilter?.endDate) {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    previousWhereClause = {
      tenantId,
      deletedAt: null,
      isLatestVersion: true,
      issuedDate: {
        gte: firstDayLastMonth,
        lt: firstDayThisMonth
      }
    };
  }

  const [statusGroupsWithSums, aggregateData, prevAggregate, quoteTrend] = await Promise.all([
    prisma.quote.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        _all: true
      },
      _sum: {
        amount: true
      }
    }),

    prisma.quote.aggregate({
      where: whereClause,
      _count: {
        _all: true
      },
      _avg: {
        amount: true
      },
      _sum: {
        amount: true
      }
    }),

    previousWhereClause
      ? prisma.quote.aggregate({
          where: previousWhereClause,
          _sum: { amount: true }
        })
      : Promise.resolve(null),

    getMonthlyQuoteValueTrend(prisma, tenantId, 6)
  ]);

  const stats: QuoteStatistics = {
    total: aggregateData._count._all,
    draft: 0,
    sent: 0,
    onHold: 0,
    accepted: 0,
    rejected: 0,
    expired: 0,
    cancelled: 0,
    converted: 0,
    totalQuotedValue: Number(aggregateData._sum.amount ?? 0),
    totalAcceptedValue: 0,
    totalConvertedValue: 0,
    conversionRate: 0,
    acceptanceRate: 0,
    avgQuoteValue: Number(aggregateData._avg.amount ?? 0),
    quoteTrend
  };

  statusGroupsWithSums.forEach((group) => {
    const count = group._count._all;
    const sum = Number(group._sum.amount ?? 0);

    switch (group.status) {
      case QuoteStatus.DRAFT:
        stats.draft = count;
        break;
      case QuoteStatus.SENT:
        stats.sent = count;
        break;
      case QuoteStatus.ON_HOLD:
        stats.onHold = count;
        break;
      case QuoteStatus.ACCEPTED:
        stats.accepted = count;
        stats.totalAcceptedValue = sum;
        break;
      case QuoteStatus.REJECTED:
        stats.rejected = count;
        break;
      case QuoteStatus.EXPIRED:
        stats.expired = count;
        break;
      case QuoteStatus.CANCELLED:
        stats.cancelled = count;
        break;
      case QuoteStatus.CONVERTED:
        stats.converted = count;
        stats.totalConvertedValue = sum;
        break;
      default:
        break;
    }
  });

  const totalSentQuotes =
    stats.sent + stats.accepted + stats.rejected + stats.expired + stats.converted;
  stats.conversionRate = totalSentQuotes > 0 ? (stats.accepted / totalSentQuotes) * 100 : 0;
  stats.acceptanceRate = stats.total > 0 ? (stats.accepted / stats.total) * 100 : 0;

  if (prevAggregate) {
    const prevTotalQuotedValue = Number(prevAggregate._sum.amount ?? 0);
    stats.quotedValueGrowth = calculateGrowth(stats.totalQuotedValue, prevTotalQuotedValue);
  }

  return stats;
}

/**
 * Get monthly quote value trend over the last N months.
 * Returns total quoted value, accepted value, and converted value for each month.
 * @param prisma - The Prisma client instance
 * @param tenantId - The tenant ID to scope all queries
 * @param limit - Number of months to retrieve. Defaults to 12.
 * @returns A promise that resolves to an array of monthly quote value trends
 */
export async function getMonthlyQuoteValueTrend(
  prisma: PrismaClient,
  tenantId: string,
  limit: number = 12
): Promise<QuoteValueTrend[]> {
  const data = await prisma.$queryRaw<
    {
      month: string;
      month_num: number;
      year: number;
      total: number;
      accepted: number;
      converted: number;
    }[]
  >(Prisma.sql`
      SELECT
        to_char(issued_date, 'Mon') as month,
        extract(month from issued_date) as month_num,
        extract(year from issued_date) as year,
        SUM(amount::numeric)::float as total,
        SUM(CASE WHEN status::text = ${QuoteStatus.ACCEPTED} THEN amount::numeric ELSE 0 END)::float as accepted,
        SUM(CASE WHEN status::text = ${QuoteStatus.CONVERTED} THEN amount::numeric ELSE 0 END)::float as converted
      FROM quotes
      WHERE deleted_at IS NULL
        AND tenant_id = ${tenantId}
        AND is_latest_version = true
      GROUP BY year, month_num, month
      ORDER BY year DESC, month_num DESC
      LIMIT ${limit}
    `);

  return data
    .map((item) => ({
      month: `${item.month} ${item.year}`,
      total: item.total,
      accepted: item.accepted,
      converted: item.converted
    }))
    .reverse();
}

/**
 * Get conversion funnel data showing the flow from sent quotes to converted.
 * Returns counts and values for each stage of the quote lifecycle.
 * @param prisma - The Prisma client instance
 * @param tenantId - The tenant ID to scope all queries
 * @param dateFilter - Optional date range filter
 * @returns A promise that resolves to conversion funnel data
 */
export async function getConversionFunnel(
  prisma: PrismaClient,
  tenantId: string,
  dateFilter?: StatsDateFilter
): Promise<ConversionFunnelData> {
  const whereClause: Prisma.QuoteWhereInput = {
    tenantId,
    deletedAt: null,
    isLatestVersion: true
  };

  if (dateFilter?.startDate || dateFilter?.endDate) {
    whereClause.issuedDate = {};
    if (dateFilter.startDate) {
      whereClause.issuedDate.gte = dateFilter.startDate;
    }

    if (dateFilter.endDate) {
      whereClause.issuedDate.lte = dateFilter.endDate;
    }
  }

  const funnelData = await prisma.quote.groupBy({
    by: ['status'],
    where: whereClause,
    _count: {
      _all: true
    },
    _sum: {
      amount: true
    }
  });

  const funnel: ConversionFunnelData = {
    sent: 0,
    onHold: 0,
    accepted: 0,
    rejected: 0,
    expired: 0,
    converted: 0,
    sentValue: 0,
    acceptedValue: 0,
    convertedValue: 0
  };

  funnelData.forEach((item) => {
    const count = item._count._all;
    const value = Number(item._sum.amount ?? 0);

    switch (item.status) {
      case QuoteStatus.SENT:
        funnel.sent = count;
        funnel.sentValue = value;
        break;
      case QuoteStatus.ON_HOLD:
        funnel.onHold = count;
        break;
      case QuoteStatus.ACCEPTED:
        funnel.accepted = count;
        funnel.acceptedValue = value;
        break;
      case QuoteStatus.REJECTED:
        funnel.rejected = count;
        break;
      case QuoteStatus.EXPIRED:
        funnel.expired = count;
        break;
      case QuoteStatus.CONVERTED:
        funnel.converted = count;
        funnel.convertedValue = value;
        break;
      default:
        break;
    }
  });

  return funnel;
}

/**
 * Get top customers by total quoted value.
 * Returns customers with highest total quote value, including conversion metrics.
 * @param prisma - The Prisma client instance
 * @param tenantId - The tenant ID to scope all queries
 * @param limit - Number of customers to retrieve. Defaults to 5.
 * @returns A promise that resolves to an array of top customers with quote metrics
 */
export async function getTopCustomersByQuotedValue(
  prisma: PrismaClient,
  tenantId: string,
  limit: number = 5
): Promise<TopCustomerByQuotedValue[]> {
  const data = await prisma.$queryRaw<
    {
      customerId: string;
      customerName: string;
      totalQuotedValue: number;
      acceptedValue: number;
      quoteCount: number;
    }[]
  >(Prisma.sql`
      SELECT
        c.id as "customerId",
        concat(c.first_name, ' ', c.last_name) as "customerName",
        SUM(q.amount::numeric)::float as "totalQuotedValue",
        SUM(CASE WHEN q.status::text IN (${QuoteStatus.ACCEPTED}, ${QuoteStatus.CONVERTED}) THEN q.amount::numeric ELSE 0 END)::float as "acceptedValue",
        COUNT(q.id)::int as "quoteCount"
      FROM quotes q
      JOIN customers c ON q.customer_id = c.id
      WHERE q.deleted_at IS NULL
        AND q.tenant_id = ${tenantId}
        AND q.is_latest_version = true
      GROUP BY c.id, "customerName"
      ORDER BY "totalQuotedValue" DESC
      LIMIT ${limit}
    `);

  return data.map((item) => ({
    customerId: item.customerId,
    customerName: item.customerName,
    totalQuotedValue: item.totalQuotedValue,
    acceptedValue: item.acceptedValue,
    quoteCount: item.quoteCount,
    conversionRate:
      item.totalQuotedValue > 0 ? (item.acceptedValue / item.totalQuotedValue) * 100 : 0
  }));
}

/**
 * Get average time to decision for quotes.
 * Calculates average days from SENT to ACCEPTED or REJECTED.
 * @param prisma - The Prisma client instance
 * @param tenantId - The tenant ID to scope all queries
 * @returns A promise that resolves to average time to decision metrics
 */
export async function getAverageTimeToDecision(
  prisma: PrismaClient,
  tenantId: string
): Promise<AverageTimeToDecision> {
  const quotes = await prisma.quote.findMany({
    where: {
      tenantId,
      deletedAt: null,
      status: {
        in: [QuoteStatus.ACCEPTED, QuoteStatus.REJECTED]
      }
    },
    select: {
      id: true,
      status: true,
      statusHistory: {
        select: {
          status: true,
          updatedAt: true
        },
        orderBy: {
          updatedAt: 'asc'
        }
      }
    }
  });

  let totalDaysToAccept = 0;
  let acceptCount = 0;
  let totalDaysToReject = 0;
  let rejectCount = 0;

  quotes.forEach((quote) => {
    const sentHistory = quote.statusHistory.find((h) => h.status === QuoteStatus.SENT);

    const decisionHistory = quote.statusHistory.find(
      (h) => h.status === QuoteStatus.ACCEPTED || h.status === QuoteStatus.REJECTED
    );

    if (sentHistory && decisionHistory) {
      const days = Math.ceil(
        (decisionHistory.updatedAt.getTime() - sentHistory.updatedAt.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (quote.status === QuoteStatus.ACCEPTED) {
        totalDaysToAccept += days;
        acceptCount++;
      } else {
        totalDaysToReject += days;
        rejectCount++;
      }
    }
  });

  const avgDaysToAccept = acceptCount > 0 ? totalDaysToAccept / acceptCount : 0;
  const avgDaysToReject = rejectCount > 0 ? totalDaysToReject / rejectCount : 0;
  const totalDecisions = acceptCount + rejectCount;
  const avgDaysToDecision =
    totalDecisions > 0 ? (totalDaysToAccept + totalDaysToReject) / totalDecisions : 0;

  return {
    avgDaysToAccept: Math.round(avgDaysToAccept * 10) / 10,
    avgDaysToReject: Math.round(avgDaysToReject * 10) / 10,
    avgDaysToDecision: Math.round(avgDaysToDecision * 10) / 10
  };
}
