'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils';
import { TransactionTrend } from '@/features/finances/transactions/types';
import { Skeleton } from '@/components/ui/skeleton';

interface IncomeExpenseTrendChartProps {
  data?: TransactionTrend[];
  isLoading?: boolean;
}

const chartConfig = {
  income: {
    label: 'Income',
    color: '#10b981', // Emerald-500
  },
  expense: {
    label: 'Expense',
    color: '#ef4444', // Red-500
  },
} satisfies ChartConfig;

export function IncomeExpenseTrendChart({ data, isLoading }: IncomeExpenseTrendChartProps) {
  if (isLoading) {
    return (
      <Card className="col-span-1 md:col-span-4">
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
    <Card className="col-span-1 md:col-span-4">
      <CardHeader>
        <CardTitle>Income vs Expense Trend</CardTitle>
        <CardDescription>Monthly comparison of income and expenses over time.</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px] w-full pt-4">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
            <Bar
              dataKey="income"
              name="Income"
              fill="var(--color-income)"
              radius={[4, 4, 0, 0]}
              barSize={32}
            />
            <Bar
              dataKey="expense"
              name="Expense"
              fill="var(--color-expense)"
              radius={[4, 4, 0, 0]}
              barSize={32}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
