'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils';
import { useTransactionStatistics } from '@/features/finances/transactions/hooks/use-transaction-queries';
import { useInvoiceStatistics } from '@/features/finances/invoices/hooks/use-invoice-queries';
import { TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { startOfMonth, endOfMonth, subMonths, format, isSameMonth } from 'date-fns';

const chartConfig = {
  value: {
    label: 'Amount',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

interface WaterfallDataItem {
  name: string;
  value: number;
  displayValue: number;
  start: number;
  end: number;
  type: 'start' | 'income' | 'expense' | 'pending' | 'end';
}

export function CashFlowWaterfallChart() {
  // Month navigation state (0 = current month, 1 = last month, etc.)
  const [monthOffset, setMonthOffset] = useState(0);

  // Calculate date range for the selected month
  const dateFilter = useMemo(() => {
    const now = new Date();
    const targetMonth = subMonths(now, monthOffset);
    const startDate = startOfMonth(targetMonth);
    // For current month, end date is today; for past months, end of that month
    const endDate = isSameMonth(targetMonth, now) ? now : endOfMonth(targetMonth);

    return { startDate, endDate };
  }, [monthOffset]);

  // Format the date range for display
  const dateRangeLabel = useMemo(() => {
    const { startDate, endDate } = dateFilter;
    return `${format(startDate, 'dd MMM')} - ${format(endDate, 'dd MMM yyyy')}`;
  }, [dateFilter]);

  const { data: transactionStats, isLoading: transactionLoading } =
    useTransactionStatistics(dateFilter);
  const { data: invoiceStats, isLoading: invoiceLoading } = useInvoiceStatistics(dateFilter);

  const isLoading = transactionLoading || invoiceLoading;

  // Build waterfall data
  const waterfallData = useMemo((): WaterfallDataItem[] => {
    if (!transactionStats) return [];

    const income = transactionStats.totalIncome || 0;
    const expenses = transactionStats.totalExpense || 0;
    const pendingRevenue = invoiceStats?.pendingRevenue || 0;
    const netCashFlow = transactionStats.netCashFlow || 0;

    // For waterfall chart, we need to calculate the "invisible" base for each bar
    // Starting point (0), then we add income, subtract expenses, show result
    return [
      {
        name: 'Income',
        value: income,
        displayValue: income,
        start: 0,
        end: income,
        type: 'income' as const,
      },
      {
        name: 'Expenses',
        value: -expenses,
        displayValue: expenses,
        start: income,
        end: income - expenses,
        type: 'expense' as const,
      },
      {
        name: 'Pending',
        value: pendingRevenue,
        displayValue: pendingRevenue,
        start: income - expenses,
        end: income - expenses + pendingRevenue,
        type: 'pending' as const,
      },
      {
        name: 'Net Position',
        value: netCashFlow + pendingRevenue,
        displayValue: netCashFlow + pendingRevenue,
        start: 0,
        end: netCashFlow + pendingRevenue,
        type: 'end' as const,
      },
    ];
  }, [transactionStats, invoiceStats]);

  // Calculate bar positions for waterfall effect
  const chartData = useMemo(() => {
    return waterfallData.map((item) => ({
      ...item,
      // The "invisible" base of the bar
      base: item.type === 'end' ? 0 : Math.min(item.start, item.end),
      // The visible part of the bar
      height: Math.abs(item.end - item.start),
    }));
  }, [waterfallData]);

  const getBarColor = (type: string) => {
    switch (type) {
      case 'income':
        return '#10b981'; // Emerald-500
      case 'expense':
        return '#ef4444'; // Red-500
      case 'pending':
        return '#f59e0b'; // Amber-500
      case 'end':
        return '#3b82f6'; // Blue-500 (always blue)
      default:
        return '#6b7280'; // Gray-500
    }
  };

  const netCashFlow = transactionStats?.netCashFlow ?? 0;
  const netCashFlowGrowth = transactionStats?.netCashFlowGrowth;

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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cash Flow Overview</CardTitle>
            <CardDescription>How money flows through your business</CardDescription>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMonthOffset((prev) => prev + 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[160px] text-center">
              <div className="text-sm font-medium">{dateRangeLabel}</div>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMonthOffset((prev) => Math.max(0, prev - 1))}
              disabled={monthOffset === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold">
              {formatCurrency({ number: netCashFlow, maxFractionDigits: 0 })}
            </div>
            {netCashFlowGrowth !== undefined && (
              <div
                className={cn(
                  'flex items-center justify-end gap-1 text-sm',
                  netCashFlowGrowth >= 0 ? 'text-emerald-600' : 'text-red-600',
                )}
              >
                {netCashFlowGrowth > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : netCashFlowGrowth < 0 ? (
                  <TrendingDown className="h-4 w-4" />
                ) : (
                  <Minus className="h-4 w-4" />
                )}
                <span>
                  {netCashFlowGrowth >= 0 ? '+' : ''}
                  {netCashFlowGrowth.toFixed(1)}%
                </span>
                <span className="text-muted-foreground">vs last period</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[350px] w-full pt-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
            <div className="text-xs text-muted-foreground mb-1">Income</div>
            <div className="text-lg font-semibold text-emerald-600">
              {formatCurrency({ number: transactionStats?.totalIncome ?? 0, maxFractionDigits: 0 })}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
            <div className="text-xs text-muted-foreground mb-1">Expenses</div>
            <div className="text-lg font-semibold text-red-600">
              {formatCurrency({
                number: transactionStats?.totalExpense ?? 0,
                maxFractionDigits: 0,
              })}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
            <div className="text-xs text-muted-foreground mb-1">Pending</div>
            <div className="text-lg font-semibold text-amber-600">
              {formatCurrency({ number: invoiceStats?.pendingRevenue ?? 0, maxFractionDigits: 0 })}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <div className="text-xs text-muted-foreground mb-1">Net Position</div>
            <div
              className={cn(
                'text-lg font-semibold',
                netCashFlow >= 0 ? 'text-blue-600' : 'text-amber-600',
              )}
            >
              {formatCurrency({
                number: netCashFlow + (invoiceStats?.pendingRevenue ?? 0),
                maxFractionDigits: 0,
              })}
            </div>
          </div>
        </div>

        {/* Waterfall Chart */}
        <ChartContainer config={chartConfig} className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.4} />
              <XAxis
                dataKey="name"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                fontSize={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tickFormatter={(value) => formatCurrency({ number: value, maxFractionDigits: 0 })}
              />
              <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const data = payload[0].payload as WaterfallDataItem;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-lg">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          {data.name}
                        </span>
                        <span
                          className={cn(
                            'text-lg font-bold',
                            data.type === 'income'
                              ? 'text-emerald-600'
                              : data.type === 'expense'
                                ? 'text-red-600'
                                : 'text-blue-600',
                          )}
                        >
                          {data.type === 'expense' ? '-' : ''}
                          {formatCurrency({ number: data.displayValue, maxFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              {/* Invisible base bar */}
              <Bar dataKey="base" stackId="stack" fill="transparent" />
              {/* Visible bar */}
              <Bar dataKey="height" stackId="stack" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.type)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
