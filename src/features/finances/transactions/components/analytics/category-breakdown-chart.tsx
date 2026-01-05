'use client';

import { useMemo } from 'react';
import { Label, Pie, PieChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Box } from '@/components/ui/box';
import { formatCurrency } from '@/lib/utils';
import type { TransactionCategoryBreakdown } from '@/features/finances/transactions/types';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

interface CategoryBreakdownChartProps {
  data?: TransactionCategoryBreakdown[];
  isLoading?: boolean;
}

// Color palette for categories
const CATEGORY_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(220, 70%, 50%)',
  'hsl(340, 75%, 50%)',
  'hsl(280, 65%, 60%)',
  'hsl(160, 60%, 45%)',
  'hsl(30, 80%, 55%)',
];

export function CategoryBreakdownChart({ data, isLoading }: CategoryBreakdownChartProps) {
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map((item, index) => ({
      category: item.category,
      amount: item.amount,
      percentage: item.percentage,
      fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }));
  }, [data]);

  const totalAmount = useMemo(() => {
    return data?.reduce((sum, item) => sum + item.amount, 0) ?? 0;
  }, [data]);

  const chartConfig = useMemo(() => {
    if (!data) return {};
    return data.reduce(
      (config, item, index) => {
        config[item.category] = {
          label: item.category,
          color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        };
        return config;
      },
      { amount: { label: 'Amount' } } as ChartConfig,
    );
  }, [data]);

  if (isLoading) {
    return (
      <Card className="col-span-1 md:col-span-3">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Skeleton className="h-40 w-40 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="col-span-1 md:col-span-3">
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>Distribution of transactions by category.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No category data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 md:col-span-3 flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Category Breakdown</CardTitle>
        <CardDescription>Distribution of transactions by category</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value) => formatCurrency({ number: value as number })}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="category"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {formatCurrency({ number: totalAmount, maxFractionDigits: 0 })}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Total
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <Box className="flex flex-wrap items-center justify-center gap-4 py-4 px-6 border-t mt-auto">
        {chartData.map((item) => (
          <Box key={item.category} className="flex items-center gap-2">
            <Box className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />
            <span className="text-[10px] uppercase font-medium text-muted-foreground">
              {item.category} ({item.percentage.toFixed(0)}%)
            </span>
          </Box>
        ))}
      </Box>
    </Card>
  );
}
