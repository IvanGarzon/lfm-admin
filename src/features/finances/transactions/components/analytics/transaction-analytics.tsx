'use client';

import { useTransactionTrend, useTopCategories } from '../../hooks/use-transaction-queries';
import { StatCard } from '@/features/finances/invoices/components/analytics/stat-card';
import { CashFlowChart } from './cash-flow-chart';
import { TopCategoriesTable } from './top-categories-table';
import { Clock, CheckCircle, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { DateRange } from 'react-day-picker';
import { CalendarDateRangePicker } from '@/components/date-range-picker';
import { TransactionStatistics } from '../../types';

interface TransactionAnalyticsProps {
  stats?: TransactionStatistics;
  isLoading: boolean;
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  comparisonLabel: string;
}

export function TransactionAnalytics({
  stats,
  isLoading,
  dateRange,
  onDateRangeChange,
  comparisonLabel,
}: TransactionAnalyticsProps) {
  const { data: trend, isLoading: trendLoading } = useTransactionTrend(12);

  const { data: topCategories, isLoading: topCategoriesLoading } = useTopCategories(5);

  const handleExport = () => {
    alert('Exporting transaction analytics data...');
  };

  return (
    <Box className="space-y-6">
      {/* Controls */}
      <Box className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Box>
          <h2 className="text-2xl font-bold tracking-tight">Detailed Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive overview of your income and expenses
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
          title="Pending"
          value={stats?.pendingTransactions ?? 0}
          description="Awaiting completion"
          icon={Clock}
          isLoading={isLoading}
          color="text-yellow-500"
        />
        <StatCard
          title="Avg Transaction"
          value={formatCurrency({ number: stats?.avgTransactionSize ?? 0, maxFractionDigits: 0 })}
          description="Average amount"
          icon={CheckCircle}
          isLoading={isLoading}
          color="text-indigo-500"
        />
      </Box>

      {/* Cash Flow Chart */}
      <CashFlowChart data={trend} isLoading={trendLoading} />

      {/* Top Categories Table */}
      <Box className="grid gap-4 md:grid-cols-1">
        <TopCategoriesTable categories={topCategories} isLoading={topCategoriesLoading} />
      </Box>
    </Box>
  );
}
