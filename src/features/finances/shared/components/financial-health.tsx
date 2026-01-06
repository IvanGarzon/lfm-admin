'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface HealthMetric {
  label: string;
  value: number;
  max: number;
  percentage: number;
  format?: 'currency' | 'percentage' | 'number';
}

interface FinancialHealthProps {
  metrics?: HealthMetric[];
  isLoading?: boolean;
}

export function FinancialHealth({ metrics = [], isLoading }: FinancialHealthProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const getHealthColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getHealthStatus = (percentage: number) => {
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Fair';
    return 'Needs Attention';
  };

  const formatValue = (metric: HealthMetric) => {
    switch (metric.format) {
      case 'currency':
        return formatCurrency({ number: metric.value });
      case 'percentage':
        return `${metric.value.toFixed(0)}%`;
      default:
        return metric.value.toString();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {metrics.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No health metrics available
          </div>
        ) : (
          metrics.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{metric.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatValue(metric)} {metric.format !== 'percentage' && `of ${metric.max}`}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      'text-xs font-medium px-2 py-1 rounded',
                      metric.percentage >= 80 && 'bg-green-100 text-green-700',
                      metric.percentage >= 60 &&
                        metric.percentage < 80 &&
                        'bg-yellow-100 text-yellow-700',
                      metric.percentage >= 40 &&
                        metric.percentage < 60 &&
                        'bg-orange-100 text-orange-700',
                      metric.percentage < 40 && 'bg-red-100 text-red-700',
                    )}
                  >
                    {getHealthStatus(metric.percentage)}
                  </span>
                </div>
              </div>
              <Progress value={metric.percentage} className="h-2" />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
