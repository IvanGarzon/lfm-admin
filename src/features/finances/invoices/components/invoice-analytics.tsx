'use client';

import { DateRange } from 'react-day-picker';
import { CheckCircle, Download, FileEdit } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { CalendarDateRangePicker } from '@/components/date-range-picker';
import { InvoiceStatistics } from '@/features/finances/invoices/types';
import { RevenueTrendChart } from '@/features/finances/invoices/components/analytics/revenue-trend-chart';
import { TopDebtorsList } from '@/features/finances/invoices/components/analytics/top-debtors-list';
import { StatusDistributionChart } from '@/features/finances/invoices/components/analytics/status-distribution-chart';
import { StatCard } from '@/features/finances/invoices/components/analytics/stat-card';

interface InvoiceAnalyticsProps {
  stats?: InvoiceStatistics;
  isLoading: boolean;
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  comparisonLabel: string;
}

export function InvoiceAnalytics({
  stats,
  isLoading,
  dateRange,
  onDateRangeChange,
  comparisonLabel,
}: InvoiceAnalyticsProps) {
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
            Comprehensive overview of your invoicing performance
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
          title="Average Value"
          value={formatCurrency({ number: stats?.avgInvoiceValue ?? 0, maxFractionDigits: 0 })}
          description="Average per invoice"
          icon={CheckCircle}
          isLoading={isLoading}
          color="text-indigo-500"
        />
        <StatCard
          title="Drafts"
          value={stats?.draft ?? 0}
          description="Awaiting review"
          icon={FileEdit}
          isLoading={isLoading}
          color="text-slate-400"
        />
      </Box>

      {/* Charts */}
      <Box className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Box className="lg:col-span-4">
          <RevenueTrendChart data={stats?.revenueTrend} isLoading={isLoading} />
        </Box>
        <Box className="lg:col-span-3">
          <StatusDistributionChart stats={stats} isLoading={isLoading} />
        </Box>
      </Box>

      {/* Top Debtors Table */}
      <Box className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
        <TopDebtorsList debtors={stats?.topDebtors} isLoading={isLoading} />
      </Box>
    </Box>
  );
}
