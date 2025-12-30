'use client';

import { useState, useMemo } from 'react';
import { useInvoiceStatistics } from '../hooks/use-invoice-queries';
import { StatCard } from './analytics/stat-card';
import { RevenueTrendChart } from './analytics/revenue-trend-chart';
import { TopDebtorsList } from './analytics/top-debtors-list';
import { StatusDistributionChart } from './analytics/status-distribution-chart';
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

export function InvoiceAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const { data: stats, isLoading } = useInvoiceStatistics({
    startDate: dateRange?.from,
    endDate: dateRange?.to,
  });

  const getComparisonLabel = () => {
    if (!dateRange?.from || !dateRange?.to) return 'vs. previous period';

    const diffInDays =
      Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1; // +1 to include both ends

    if (diffInDays === 1) return 'vs. previous day';
    if (diffInDays === 7) return 'vs. last week';
    if (diffInDays === 30 || diffInDays === 31) return 'vs. last month';

    return `vs. previous ${diffInDays} days`;
  };

  const comparisonLabel = getComparisonLabel();

  const collectionRate = useMemo(() => {
    if (!stats) return 0;
    const totalPotential = stats.totalRevenue + stats.pendingRevenue;
    return totalPotential > 0 ? (stats.totalRevenue / totalPotential) * 100 : 0;
  }, [stats]);

  const handleExport = () => {
    // Placeholder for export functionality
    alert('Exporting analytics data...');
  };

  return (
    <Box className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Invoice Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive overview of your invoicing performance.
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
          title="Total Revenue"
          value={formatCurrency({ number: stats?.totalRevenue ?? 0, maxFractionDigits: 0 })}
          description="Collected revenue"
          comparisonLabel={comparisonLabel}
          icon={DollarSign}
          growth={stats?.totalRevenueGrowth}
          isLoading={isLoading}
          color="text-emerald-500"
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency({ number: stats?.pendingRevenue ?? 0, maxFractionDigits: 0 })}
          description="Awaiting payment"
          comparisonLabel={comparisonLabel}
          icon={Clock}
          growth={stats?.pendingRevenueGrowth}
          isLoading={isLoading}
          color="text-yellow-500"
        />
        <StatCard
          title="Collection Rate"
          value={`${collectionRate.toFixed(0)}%`}
          description="Revenue collected"
          icon={Percent}
          isLoading={isLoading}
          color="text-green-500"
        />
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
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <RevenueTrendChart data={stats?.revenueTrend} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-3">
          <StatusDistributionChart stats={stats} isLoading={isLoading} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
        <TopDebtorsList debtors={stats?.topDebtors} isLoading={isLoading} />
      </div>
    </Box>
  );
}
