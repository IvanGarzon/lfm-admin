'use client';

import { useState, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils';
import { TransactionTrend } from '@/features/finances/transactions/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Box } from '@/components/ui/box';

interface CashFlowChartProps {
  data?: TransactionTrend[];
  isLoading?: boolean;
}

const chartConfig = {
  income: {
    label: 'Income',
    color: 'hsl(var(--chart-1))', // Emerald/Green
  },
  expense: {
    label: 'Expense',
    color: 'hsl(var(--chart-2))', // Green for expenses
  },
} satisfies ChartConfig;

export function CashFlowChart({ data, isLoading }: CashFlowChartProps) {
  const monthsToShow = 6;
  // Offset represents how many months back from now the window ends
  // 0 = window ends at current month (showing last 6 months)
  // -3 = window ends 3 months ago
  // +3 = window ends 3 months in future (moved forward 3 from default)
  const [monthOffset, setMonthOffset] = useState(0);

  const handleNavigateBack = () => {
    setMonthOffset((prev) => prev - 3); // Go back in time
  };

  const handleNavigateForward = () => {
    setMonthOffset((prev) => prev + 3); // Go forward in time
  };

  // Calculate the date range label
  const dateRangeLabel = useMemo(() => {
    const now = new Date();
    const startMonth = now.getMonth() + monthOffset - (monthsToShow - 1);
    const endMonth = now.getMonth() + monthOffset;

    const startDate = new Date(now.getFullYear(), startMonth, 1);
    const endDate = new Date(now.getFullYear(), endMonth, 1);

    const formatMonthYear = (date: Date) => {
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear().toString().slice(-2);
      return `${month} ${year}`;
    };

    return `${formatMonthYear(startDate)} - ${formatMonthYear(endDate)}`;
  }, [monthOffset, monthsToShow]);

  // Transform data to show expenses as negative values with time navigation
  const chartData = useMemo(() => {
    // Helper function to format month
    const formatMonth = (date: Date): string => {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    // Helper function to generate N months with offset
    const generateMonths = (
      count: number,
      offset: number,
    ): Array<{ month: string; income: number; expense: number }> => {
      const months = [];
      const now = new Date();
      // Start from offset months from now
      const startMonth = now.getMonth() + offset;

      for (let i = count - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), startMonth - i, 1);
        months.push({
          month: formatMonth(date),
          income: 0,
          expense: 0,
        });
      }
      return months;
    };

    // Generate the 6-month window based on current offset
    const allMonths = generateMonths(monthsToShow, monthOffset);

    if (!data || data.length === 0) {
      return allMonths;
    }

    // Map existing data to the generated months
    const result = allMonths.map((emptyMonth) => {
      const existingData = data.find((item) => item.month === emptyMonth.month);
      if (existingData) {
        return {
          ...existingData,
          income: existingData.income,
          expense: Math.abs(existingData.expense),
        };
      }
      return emptyMonth;
    });

    return result;
  }, [data, monthOffset]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Cash Flow</CardTitle>
          </Box>
          <Box className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleNavigateBack}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">{dateRangeLabel}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNavigateForward}
              disabled={monthOffset >= 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Box>
        </Box>
      </CardHeader>
      <CardContent>
        <Box className="h-[350px] w-full">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid
                vertical={false}
                horizontal={true}
                strokeDasharray="3 3"
                opacity={0.5}
                stroke="hsl(var(--muted-foreground))"
              />
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
                tickFormatter={(value) => {
                  const absValue = Math.abs(value);
                  if (absValue >= 1000) {
                    return `${value >= 0 ? '' : '-'}$${(absValue / 1000).toFixed(0)}K`;
                  }
                  return `$${value}`;
                }}
              />

              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      const absValue = Math.abs(Number(value));
                      return [
                        formatCurrency({ number: absValue, maxFractionDigits: 0 }),
                        name === 'income' ? 'Income' : 'Expense',
                      ];
                    }}
                  />
                }
              />
              <Bar
                dataKey="income"
                name="Income"
                fill="hsl(160, 84%, 39%)"
                radius={[4, 4, 0, 0]}
                barSize={28}
              />
              <Bar
                dataKey="expense"
                name="Expense"
                fill="hsl(0, 84%, 60%)"
                radius={[4, 4, 0, 0]}
                barSize={28}
              />
            </BarChart>
          </ChartContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
