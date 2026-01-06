'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils';
import { useInvoiceStatistics } from '@/features/finances/invoices/hooks/use-invoice-queries';
import { useQuoteValueTrend } from '@/features/finances/quotes/hooks/use-quote-queries';
import { useTransactionTrend } from '@/features/finances/transactions/hooks/use-transaction-queries';

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: '#10b981', // Emerald-500
  },
  quotes: {
    label: 'Quoted Value',
    color: '#3b82f6', // Blue-500
  },
  income: {
    label: 'Income',
    color: '#8b5cf6', // Purple-500
  },
} satisfies ChartConfig;

export function CombinedFinancialChart() {
  const { data: invoiceStats, isLoading: invoiceLoading } = useInvoiceStatistics();
  const { data: quoteTrend, isLoading: quoteLoading } = useQuoteValueTrend(12);
  const { data: transactionTrend, isLoading: transactionLoading } = useTransactionTrend(12);

  const isLoading = invoiceLoading || quoteLoading || transactionLoading;

  // Combine data from all sources
  const chartData = useMemo(() => {
    if (!invoiceStats?.revenueTrend || !quoteTrend || !transactionTrend) {
      return [];
    }

    // Create a map of all months
    const monthsMap = new Map<
      string,
      { month: string; revenue?: number; quotes?: number; income?: number }
    >();

    // Add invoice revenue data
    invoiceStats.revenueTrend?.forEach((item) => {
      monthsMap.set(item.month, {
        month: item.month,
        revenue: item.paid || 0,
      });
    });

    // Add quote data
    quoteTrend.forEach((item) => {
      const existing = monthsMap.get(item.month) || { month: item.month };
      monthsMap.set(item.month, {
        ...existing,
        quotes: item.totalValue || 0,
      });
    });

    // Add transaction income data
    transactionTrend.forEach((item) => {
      const existing = monthsMap.get(item.month) || { month: item.month };
      monthsMap.set(item.month, {
        ...existing,
        income: item.income || 0,
      });
    });

    return Array.from(monthsMap.values()).slice(-12);
  }, [invoiceStats, quoteTrend, transactionTrend]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Overview</CardTitle>
        <CardDescription>Combined view of revenue, quotes, and income over time</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px] w-full pt-4">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.4} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                fontSize={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tickFormatter={(value) =>
                  formatCurrency({ number: value, maxFractionDigits: 0 }).replace('$', '$')
                }
              />
              <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="var(--color-revenue)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="quotes"
                name="Quoted Value"
                stroke="var(--color-quotes)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="var(--color-income)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
