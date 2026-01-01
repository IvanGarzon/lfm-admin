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
import type { QuoteValueTrend } from '@/features/finances/quotes/types';
import { Skeleton } from '@/components/ui/skeleton';

interface QuoteValueTrendChartProps {
  data?: QuoteValueTrend[];
  isLoading?: boolean;
}

const chartConfig = {
  total: {
    label: 'Total Quoted',
    color: 'hsl(var(--primary))',
  },
  accepted: {
    label: 'Accepted',
    color: '#10b981', // Emerald-500
  },
  converted: {
    label: 'Converted',
    color: '#8b5cf6', // Purple-500
  },
} satisfies ChartConfig;

export function QuoteValueTrendChart({ data, isLoading }: QuoteValueTrendChartProps) {
  if (isLoading) {
    return (
      <Card className="col-span-1 md:col-span-2">
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
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>Quote Value Trend</CardTitle>
        <CardDescription>
          Monthly comparison of total quoted value vs. accepted and converted quotes.
        </CardDescription>
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
              dataKey="total"
              name="Total Quoted"
              fill="var(--color-total)"
              radius={[4, 4, 0, 0]}
              barSize={24}
            />
            <Bar
              dataKey="accepted"
              name="Accepted"
              fill="var(--color-accepted)"
              radius={[4, 4, 0, 0]}
              barSize={24}
            />
            <Bar
              dataKey="converted"
              name="Converted"
              fill="var(--color-converted)"
              radius={[4, 4, 0, 0]}
              barSize={24}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
