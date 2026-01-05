'use client';

import { useState } from 'react';
import {
  useTransactionStatistics,
  useTransactionTrend,
  useCategoryBreakdown,
  useTopCategories,
} from '../../hooks/use-transaction-queries';
import { StatCard } from '@/features/finances/invoices/components/analytics/stat-card';
import { IncomeExpenseTrendChart } from './income-expense-trend-chart';
import { CategoryBreakdownChart } from './category-breakdown-chart';
import { TopCategoriesTable } from './top-categories-table';
import { DollarSign, TrendingDown, TrendingUp, Clock, CheckCircle, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { DateRange } from 'react-day-picker';
import { CalendarDateRangePicker } from '@/components/date-range-picker';
import { subDays } from 'date-fns';

export function TransactionAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const { data: stats, isLoading: statsLoading } = useTransactionStatistics({
    startDate: dateRange?.from,
    endDate: dateRange?.to,
  });

  const { data: trend, isLoading: trendLoading } = useTransactionTrend(12);

  const { data: breakdown, isLoading: breakdownLoading } = useCategoryBreakdown({
    startDate: dateRange?.from,
    endDate: dateRange?.to,
  });

  const { data: topCategories, isLoading: topCategoriesLoading } = useTopCategories(5);

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

  const handleExport = () => {
    alert('Exporting transaction analytics data...');
  };

  return (
    <Box className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Transaction Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive overview of your income and expenses.
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
          title="Total Income"
          value={formatCurrency({ number: stats?.totalIncome ?? 0, maxFractionDigits: 0 })}
          description="Income received"
          comparisonLabel={comparisonLabel}
          icon={TrendingUp}
          growth={stats?.totalIncomeGrowth}
          isLoading={statsLoading}
          color="text-emerald-500"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency({ number: stats?.totalExpense ?? 0, maxFractionDigits: 0 })}
          description="Money spent"
          comparisonLabel={comparisonLabel}
          icon={TrendingDown}
          growth={stats?.totalExpenseGrowth}
          isLoading={statsLoading}
          color="text-red-500"
        />
        <StatCard
          title="Net Cash Flow"
          value={formatCurrency({ number: stats?.netCashFlow ?? 0, maxFractionDigits: 0 })}
          description="Income - Expenses"
          comparisonLabel={comparisonLabel}
          icon={DollarSign}
          growth={stats?.netCashFlowGrowth}
          isLoading={statsLoading}
          color="text-blue-500"
        />
        <StatCard
          title="Pending"
          value={stats?.pendingTransactions ?? 0}
          description="Awaiting completion"
          icon={Clock}
          isLoading={statsLoading}
          color="text-yellow-500"
        />
        <StatCard
          title="Avg Transaction"
          value={formatCurrency({ number: stats?.avgTransactionSize ?? 0, maxFractionDigits: 0 })}
          description="Average amount"
          icon={CheckCircle}
          isLoading={statsLoading}
          color="text-indigo-500"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <div className="md:col-span-4">
          <IncomeExpenseTrendChart data={trend} isLoading={trendLoading} />
        </div>
        <div className="md:col-span-3">
          <CategoryBreakdownChart data={breakdown} isLoading={breakdownLoading} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <TopCategoriesTable categories={topCategories} isLoading={topCategoriesLoading} />
      </div>
    </Box>
  );
}
