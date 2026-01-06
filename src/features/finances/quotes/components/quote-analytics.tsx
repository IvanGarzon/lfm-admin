'use client';

import { useMemo } from 'react';
import {
  useQuoteValueTrend,
  useConversionFunnel,
  useTopCustomersByQuotedValue,
  useAverageTimeToDecision,
} from '../hooks/use-quote-queries';
import { StatCard } from '@/features/finances/invoices/components/analytics/stat-card';
import { QuoteValueTrendChart } from './analytics/quote-value-trend-chart';
import { ConversionFunnelChart } from './analytics/conversion-funnel-chart';
import { TopCustomersQuotedTable } from './analytics/top-customers-quoted-table';
import { Clock, TrendingUp, Download } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { DateRange } from 'react-day-picker';
import { CalendarDateRangePicker } from '@/components/date-range-picker';
import { QuoteStatistics } from '@/features/finances/quotes/types';

interface QuoteAnalyticsProps {
  stats?: QuoteStatistics;
  isLoading: boolean;
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  comparisonLabel: string;
}

export function QuoteAnalytics({
  stats,
  isLoading,
  dateRange,
  onDateRangeChange,
  comparisonLabel,
}: QuoteAnalyticsProps) {
  const { data: valueTrend, isLoading: isLoadingTrend } = useQuoteValueTrend(12);
  const { data: funnelData, isLoading: isLoadingFunnel } = useConversionFunnel({
    startDate: dateRange?.from,
    endDate: dateRange?.to,
  });
  const { data: topCustomers, isLoading: isLoadingTopCustomers } = useTopCustomersByQuotedValue(5);
  const { data: avgTimeToDecision, isLoading: isLoadingAvgTime } = useAverageTimeToDecision();

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
      {/* Controls */}
      <Box className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Box>
          <h2 className="text-2xl font-bold tracking-tight">Detailed Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive overview of your quoting performance and conversion metrics
          </p>
        </Box>
        <Box className="flex flex-wrap items-center gap-2">
          <CalendarDateRangePicker date={dateRange} onDateChange={onDateRangeChange} />
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </Box>
      </Box>

      {/* Additional Metrics */}
      <Box className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          description="Accepted / Decisions"
          icon={TrendingUp}
          isLoading={isLoading}
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
      </Box>

      {/* Charts */}
      <Box className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Box className="lg:col-span-4">
          <QuoteValueTrendChart data={valueTrend} isLoading={isLoadingTrend} />
        </Box>
        <Box className="lg:col-span-3">
          <ConversionFunnelChart data={funnelData} isLoading={isLoadingFunnel} />
        </Box>
      </Box>

      {/* Top Customers Table */}
      <Box className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
        <TopCustomersQuotedTable customers={topCustomers} isLoading={isLoadingTopCustomers} />
      </Box>
    </Box>
  );
}
