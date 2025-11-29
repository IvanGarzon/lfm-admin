'use client';

import { useMemo } from 'react';
import { Label, Pie, PieChart } from 'recharts';
import { DollarSign, PieChartIcon, CheckCircle, TrendingUp, FileEdit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Box } from '@/components/ui/box';
import { formatCurrency } from '@/lib/utils';
import type { QuoteStatistics } from '@/features/finances/quotes/types';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

type QuoteStatsProps = {
  stats: QuoteStatistics | undefined;
  isLoading: boolean;
  error?: Error | null;
};

function getStatCards(stats: QuoteStatistics) {
  return [
    {
      title: 'Total Quoted',
      value: formatCurrency({ number: stats.totalQuotedValue, maxFractionDigits: 0 }),
      description: `${stats.total} quotes`,
      icon: DollarSign,
      color: 'text-blue-600',
    },
    {
      title: 'Accepted Value',
      value: formatCurrency({ number: stats.totalAcceptedValue, maxFractionDigits: 0 }),
      description: `${stats.accepted} accepted`,
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: 'Conversion Rate',
      value: `${stats.conversionRate.toFixed(1)}%`,
      description: 'Quotes converted',
      icon: TrendingUp,
      color: 'text-purple-600',
    },
    {
      title: 'Draft Quotes',
      value: stats.draft.toString(),
      description: 'Awaiting review',
      icon: FileEdit,
      color: 'text-gray-600',
    },
  ];
}

export function QuoteStats({ stats, isLoading, error }: QuoteStatsProps) {
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

  const statCards = getStatCards(stats);

  const chartData = [
    { status: 'draft', count: stats.draft, fill: 'var(--color-draft)' },
    { status: 'sent', count: stats.sent, fill: 'var(--color-sent)' },
    { status: 'accepted', count: stats.accepted, fill: 'var(--color-accepted)' },
    { status: 'rejected', count: stats.rejected, fill: 'var(--color-rejected)' },
    { status: 'expired', count: stats.expired, fill: 'var(--color-expired)' },
    { status: 'converted', count: stats.converted, fill: 'var(--color-converted)' },
  ];

  const chartConfig = {
    count: {
      label: 'Quotes',
    },
    draft: {
      label: 'Draft',
      color: 'hsl(var(--chart-1))',
    },
    sent: {
      label: 'Sent',
      color: 'hsl(var(--chart-2))',
    },
    accepted: {
      label: 'Accepted',
      color: 'hsl(var(--chart-3))',
    },
    rejected: {
      label: 'Rejected',
      color: 'hsl(var(--chart-4))',
    },
    expired: {
      label: 'Expired',
      color: 'hsl(var(--chart-5))',
    },
    converted: {
      label: 'Converted',
      color: 'hsl(var(--chart-6))',
    },
  } satisfies ChartConfig;

  const totalCount = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0);
  }, [chartData]);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="grid gap-3 grid-cols-2">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Quote Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center pb-6">
          {totalCount > 0 ? (
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
                              {totalCount.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              Total Quotes
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          ) : (
            <Box className="text-center text-muted-foreground py-12">No quotes yet</Box>
          )}
        </CardContent>
      </Card> */}
    </div>
  );
}
