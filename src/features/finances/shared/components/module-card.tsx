'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface ModuleCardProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  primaryMetric: {
    label: string;
    value: string;
    growth?: number;
  };
  secondaryMetrics: Array<{
    label: string;
    value: string;
  }>;
  chartData?: Array<{ value: number }>;
  href: string;
  isLoading?: boolean;
}

export function ModuleCard({
  title,
  icon: Icon,
  iconColor,
  primaryMetric,
  secondaryMetrics,
  chartData,
  href,
  isLoading,
}: ModuleCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-8 rounded" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-40" />
          </div>
          <Skeleton className="h-16 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasGrowth = primaryMetric.growth !== undefined;
  const isPositiveGrowth = (primaryMetric.growth ?? 0) > 0;

  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <div className={cn('rounded-lg bg-primary/10 p-2', iconColor)}>
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Metric */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{primaryMetric.label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold">{primaryMetric.value}</p>
            {hasGrowth && (
              <div
                className={cn(
                  'flex items-center gap-1 text-sm font-medium',
                  isPositiveGrowth ? 'text-green-600' : 'text-red-600',
                )}
              >
                {isPositiveGrowth ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{Math.abs(primaryMetric.growth ?? 0).toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Mini Chart */}
        {chartData && chartData.length > 0 && (
          <div className="h-16 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill={`url(#gradient-${title})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {secondaryMetrics.map((metric, index) => (
            <div key={index} className="space-y-1">
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p className="text-lg font-semibold">{metric.value}</p>
            </div>
          ))}
        </div>

        {/* View Analytics Button */}
        <Link href={href} className="block">
          <Button variant="outline" className="w-full group">
            View Analytics
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
