'use client';

import { useMemo } from 'react';
import { Label, Pie, PieChart } from 'recharts';
import { PieChartIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Box } from '@/components/ui/box';
import { formatCurrency } from '@/lib/utils';
import type { InvoiceStatistics } from '@/features/finances/invoices/types';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface StatusDistributionChartProps {
  stats?: InvoiceStatistics;
  isLoading?: boolean;
}

export function StatusDistributionChart({ stats, isLoading }: StatusDistributionChartProps) {
  const chartData = useMemo(() => {
    if (!stats) return [];
    return [
      {
        status: 'draft',
        count: stats.draft,
        fill: 'rgb(229, 231, 235)',
      },
      {
        status: 'pending',
        count: stats.pending,
        fill: 'rgb(255, 240, 133)',
      },
      {
        status: 'paid',
        count: stats.paid,
        fill: 'rgb(185, 248, 207)',
      },
      {
        status: 'partial',
        count: stats.partiallyPaid,
        fill: 'rgb(254, 215, 170)',
      },
      {
        status: 'overdue',
        count: stats.overdue,
        fill: 'rgb(233, 212, 255)',
      },
      {
        status: 'cancelled',
        count: stats.cancelled,
        fill: 'rgb(255, 201, 201)',
      },
    ].filter((item) => item.count > 0);
  }, [stats]);

  const totalInvoices = stats?.total ?? 0;

  const chartConfig = {
    count: { label: 'Invoices' },
    draft: { label: 'Draft', color: 'rgb(229, 231, 235)' },
    pending: { label: 'Pending', color: 'rgb(255, 240, 133)' },
    paid: { label: 'Paid', color: 'rgb(0, 130, 54)' },
    partial: { label: 'Partial', color: 'rgb(249, 115, 22)' },
    overdue: { label: 'Overdue', color: 'rgb(250, 245, 255, 1)' },
    cancelled: { label: 'Cancelled', color: 'rgb(254, 242, 242)' },
  } satisfies ChartConfig;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Box className="h-6 w-48 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Box className="h-40 w-40 rounded-full bg-muted animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle>Status Distribution</CardTitle>
      </CardHeader>
      {chartData.length === 0 ? (
        <CardContent className="flex-1 flex flex-col items-center justify-center py-12">
          <PieChartIcon className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground text-center">
            No invoices found for this period
          </p>
        </CardContent>
      ) : (
        <>
          <CardContent className="flex-1 pb-0">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="status"
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
                              {totalInvoices.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              Invoices
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
              <Box key={item.status} className="flex items-center gap-2">
                <Box className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />
                <span className="text-[10px] uppercase font-medium text-muted-foreground">
                  {item.status} ({((item.count / (totalInvoices || 1)) * 100).toFixed(0)}%)
                </span>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Card>
  );
}
