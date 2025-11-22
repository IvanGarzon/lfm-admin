'use client';

import { useMemo } from 'react';
import { Label, Pie, PieChart } from 'recharts';
import { DollarSign, PieChartIcon, CheckCircle, Clock, FileEdit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Box } from '@/components/ui/box';
import { formatCurrency } from '@/lib/utils';
import type { InvoiceStatistics } from '@/features/finances/invoices/types';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

type InvoiceStatsProps = {
  stats: InvoiceStatistics | undefined;
  isLoading: boolean;
  error?: Error | null;
};

function getStatCards(stats: InvoiceStatistics) {
  const totalPotentialRevenue = stats.totalRevenue + stats.pendingRevenue;
  const collectionRate =
    totalPotentialRevenue > 0 ? (stats.totalRevenue / totalPotentialRevenue) * 100 : 0;

  return [
    {
      title: 'Total Revenue',
      value: formatCurrency({ number: stats.totalRevenue, maxFractionDigits: 0 }),
      description: `${stats.paid} paid invoices`,
      icon: DollarSign,
      color: 'text-emerald-600',
    },
    {
      title: 'Pending Revenue',
      value: formatCurrency({ number: stats.pendingRevenue, maxFractionDigits: 0 }),
      description: `${stats.pending + stats.overdue} outstanding`,
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      title: 'Collection Rate',
      value: `${collectionRate.toFixed(0)}%`,
      description: 'Revenue collected',
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: 'Draft Invoices',
      value: stats.draft.toString(),
      description: 'Awaiting review',
      icon: FileEdit,
      color: 'text-gray-600',
    },
  ];
}

export function InvoiceStats({ stats, isLoading, error }: InvoiceStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-3 grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-full min-h-[300px]">
            <Skeleton className="h-[200px] w-[200px] rounded-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load statistics: {error.message}</AlertDescription>
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = useMemo(() => getStatCards(stats), [stats]);

  const chartData = useMemo(() => {
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

  const totalInvoices = stats.total;
  const chartConfig = {
    count: {
      label: 'Invoices',
    },
    draft: {
      label: 'Draft',
      color: 'rgb(229, 231, 235)',
    },
    pending: {
      label: 'Pending',
      color: 'rgb(255, 240, 133)',
    },
    paid: {
      label: 'Paid',
      color: 'rgb(0, 130, 54)',
    },
    overdue: {
      label: 'Overdue',
      color: 'rgb(250, 245, 255, 1)',
    },
    cancelled: {
      label: 'Cancelled',
      color: 'rgb(254, 242, 242)',
    },
  } satisfies ChartConfig;

  return (
    <Box className="grid gap-3 md:grid-cols-2 min-w-0">
      <Box className="grid gap-3 grid-cols-1 md:grid-cols-2 auto-rows-fr">
        {statCards.map((stat) => (
          <Card key={stat.title} className="@container/card min-w-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium truncate pr-2">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 shrink-0 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <Box className="text-xl font-bold wrap-break-word" suppressHydrationWarning>
                {stat.value}
              </Box>
              <Box className="text-xs text-muted-foreground truncate" suppressHydrationWarning>
                {stat.description}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Card className="@container/card min-w-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <Box className="flex flex-col gap-1">
              <span>Invoice Status Distribution</span>
              <Box className="text-xs text-muted-foreground font-normal">
                <span>Monthly Avg. {formatCurrency({ number: stats.avgInvoiceValue })}</span>
              </Box>
            </Box>
          </CardTitle>
          <PieChartIcon className="h-4 w-4 shrink-0" />
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center gap-6 pt-6 pb-6 min-w-0">
          <ChartContainer
            config={chartConfig}
            className="aspect-square h-[180px] w-[180px] shrink-0 mx-auto sm:mx-0"
          >
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="status"
                innerRadius={50}
                strokeWidth={3}
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
                            className="fill-muted-foreground text-sm"
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
          <Box className="flex-1 space-y-2 w-full min-w-0">
            {chartData.map((item) => {
              const config = chartConfig[item.status as keyof typeof chartConfig];
              const percentage = ((item.count / totalInvoices) * 100).toFixed(1);
              return (
                <Box key={item.status} className="flex items-center justify-between gap-2 min-w-0">
                  <Box className="flex items-center gap-2 min-w-0 flex-1">
                    <Box
                      className="h-3 w-3 rounded-sm shrink-0"
                      style={{
                        backgroundColor: item.fill,
                      }}
                    />
                    <span className="text-sm font-medium capitalize truncate">{config.label}</span>
                  </Box>
                  <Box className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold">{item.count}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      ({percentage}%)
                    </span>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
