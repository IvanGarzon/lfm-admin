'use client';

import { useState, useMemo } from 'react';
import {
  useQuoteStatistics,
  useQuoteValueTrend,
  useConversionFunnel,
  useTopCustomersByQuotedValue,
  useAverageTimeToDecision,
} from '../hooks/use-quote-queries';
import { StatCard } from '@/features/finances/invoices/components/analytics/stat-card';
import { QuoteValueTrendChart } from './analytics/quote-value-trend-chart';
import { ConversionFunnelChart } from './analytics/conversion-funnel-chart';
import { TopCustomersQuotedTable } from './analytics/top-customers-quoted-table';
import {
  DollarSign,
  Clock,
  CheckCircle,
  TrendingUp,
  Download,
  Percent,
  FileEdit,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { DateRange } from 'react-day-picker';
import { CalendarDateRangePicker } from '@/components/date-range-picker';
import { subDays } from 'date-fns';

export function QuoteAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const { data: stats, isLoading: isLoadingStats } = useQuoteStatistics({
    startDate: dateRange?.from,
    endDate: dateRange?.to,
  });

  const { data: valueTrend, isLoading: isLoadingTrend } = useQuoteValueTrend(12);
  const { data: funnelData, isLoading: isLoadingFunnel } = useConversionFunnel({
    startDate: dateRange?.from,
    endDate: dateRange?.to,
  });
  const { data: topCustomers, isLoading: isLoadingTopCustomers } = useTopCustomersByQuotedValue(5);
  const { data: avgTimeToDecision, isLoading: isLoadingAvgTime } = useAverageTimeToDecision();

  const isLoading =
    isLoadingStats ||
    isLoadingTrend ||
    isLoadingFunnel ||
    isLoadingTopCustomers ||
    isLoadingAvgTime;

  const getComparisonLabel = () => {
    if (!dateRange?.from || !dateRange?.to) return 'vs. previous period';

    const diffInDays =
      Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (diffInDays === 1) return 'vs. previous day';
    if (diffInDays === 7) return 'vs. last week';
    if (diffInDays === 30 || diffInDays === 31) return 'vs. last month';

    return `vs. previous ${diffInDays} days`;
  };

  const comparisonLabel = getComparisonLabel();

  const winRate = useMemo(() => {
    if (!stats) return 0;
    const totalDecisions = stats.accepted + stats.rejected;
    return totalDecisions > 0 ? (stats.accepted / totalDecisions) * 100 : 0;
  }, [stats]);

  const handleExport = () => {
    // Placeholder for export functionality
    alert('Exporting analytics data...');
  };

  return (
    <Box className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quote Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive overview of your quoting performance and conversion metrics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CalendarDateRangePicker date={dateRange} onDateChange={setDateRange} />
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Quoted"
          value={formatCurrency({ number: stats?.totalQuotedValue ?? 0, maxFractionDigits: 0 })}
          description="Total value of all quotes"
          icon={DollarSign}
          isLoading={isLoadingStats}
          color="text-blue-500"
        />
        <StatCard
          title="Accepted Value"
          value={formatCurrency({ number: stats?.totalAcceptedValue ?? 0, maxFractionDigits: 0 })}
          description="Value of accepted quotes"
          icon={CheckCircle}
          isLoading={isLoadingStats}
          color="text-emerald-500"
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats?.conversionRate.toFixed(1) ?? 0}%`}
          description="Accepted / Sent"
          icon={Percent}
          isLoading={isLoadingStats}
          color="text-green-500"
        />
        <StatCard
          title="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          description="Accepted / Decisions"
          icon={TrendingUp}
          isLoading={isLoadingStats}
          color="text-purple-500"
        />
        <StatCard
          title="Avg Time to Decision"
          value={`${avgTimeToDecision?.avgDaysToDecision.toFixed(1) ?? 0} days`}
          description="From sent to decision"
          icon={Clock}
          isLoading={isLoadingAvgTime}
          color="text-orange-500"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <QuoteValueTrendChart data={valueTrend} isLoading={isLoadingTrend} />
        </div>
        <div className="lg:col-span-3">
          <ConversionFunnelChart data={funnelData} isLoading={isLoadingFunnel} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
        <TopCustomersQuotedTable customers={topCustomers} isLoading={isLoadingTopCustomers} />
      </div>
    </Box>
  );
}
