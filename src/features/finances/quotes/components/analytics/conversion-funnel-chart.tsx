'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils';
import type { ConversionFunnelData } from '@/features/finances/quotes/types';
import { Skeleton } from '@/components/ui/skeleton';

interface ConversionFunnelChartProps {
  data?: ConversionFunnelData;
  isLoading?: boolean;
}

const chartConfig = {
  count: {
    label: 'Quotes',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

const COLORS = {
  sent: '#3b82f6', // Blue-500
  onHold: '#f59e0b', // Amber-500
  accepted: '#10b981', // Emerald-500
  rejected: '#ef4444', // Red-500
  expired: '#94a3b8', // Slate-400
  converted: '#8b5cf6', // Purple-500
};

export function ConversionFunnelChart({ data, isLoading }: ConversionFunnelChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const funnelData = [
    { name: 'Sent', count: data.sent, color: COLORS.sent },
    { name: 'On Hold', count: data.onHold, color: COLORS.onHold },
    { name: 'Accepted', count: data.accepted, color: COLORS.accepted },
    { name: 'Rejected', count: data.rejected, color: COLORS.rejected },
    { name: 'Expired', count: data.expired, color: COLORS.expired },
    { name: 'Converted', count: data.converted, color: COLORS.converted },
  ];

  // Calculate conversion rate
  const totalSent = data.sent + data.accepted + data.rejected + data.expired + data.converted;
  const conversionRate = totalSent > 0 ? ((data.accepted / totalSent) * 100).toFixed(1) : '0.0';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
        <CardDescription>Quote progression from sent to final status</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px] w-full pt-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Acceptance Rate:{' '}
            <span className="font-semibold text-emerald-600">{conversionRate}%</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Total Value:{' '}
            <span className="font-semibold">
              {formatCurrency({ number: data.sentValue, maxFractionDigits: 0 })}
            </span>
          </div>
        </div>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart
            data={funnelData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
            <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium">{data.name}</span>
                      <span className="text-sm font-bold">{data.count} quotes</span>
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {funnelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
