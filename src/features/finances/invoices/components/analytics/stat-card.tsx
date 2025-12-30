'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Box } from '@/components/ui/box';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  comparisonLabel?: string;
  icon: LucideIcon;
  growth?: number;
  color?: string;
  isLoading?: boolean;
}

export function StatCard({
  title,
  value,
  description,
  comparisonLabel,
  icon: Icon,
  growth,
  color,
  isLoading,
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-40 mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn('h-4 w-4', color)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <Box className="flex items-center gap-2 mt-1">
          {growth !== undefined && (
            <div
              className={cn(
                'flex items-center text-xs font-medium',
                growth > 0
                  ? 'text-emerald-600'
                  : growth < 0
                    ? 'text-red-600'
                    : 'text-muted-foreground',
              )}
            >
              {growth > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : growth < 0 ? (
                <TrendingDown className="h-3 w-3 mr-1" />
              ) : null}
              {growth > 0 ? '+' : ''}
              {growth}%
              {comparisonLabel && (
                <span className="ml-1 font-normal opacity-80 text-muted-foreground">
                  {comparisonLabel}
                </span>
              )}
            </div>
          )}
          {description && !growth && (
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
