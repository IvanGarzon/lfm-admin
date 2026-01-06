'use client';

import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { StatCard } from '@/features/finances/invoices/components/analytics/stat-card';
import { TransactionStatistics } from '@/features/finances/transactions/types';

interface TransactionOverviewProps {
  stats?: TransactionStatistics;
  isLoading: boolean;
  comparisonLabel: string;
}

export function TransactionOverview({
  stats,
  isLoading,
  comparisonLabel,
}: TransactionOverviewProps) {
  return (
    <Box className="grid gap-4 md:grid-cols-3">
      <StatCard
        title="Total Income"
        value={formatCurrency({ number: stats?.totalIncome ?? 0, maxFractionDigits: 0 })}
        description="Income received"
        comparisonLabel={comparisonLabel}
        icon={TrendingUp}
        growth={stats?.totalIncomeGrowth}
        isLoading={isLoading}
        color="text-emerald-500"
      />
      <StatCard
        title="Total Expenses"
        value={formatCurrency({ number: stats?.totalExpense ?? 0, maxFractionDigits: 0 })}
        description="Money spent"
        comparisonLabel={comparisonLabel}
        icon={TrendingDown}
        growth={stats?.totalExpenseGrowth}
        isLoading={isLoading}
        color="text-red-500"
      />
      <StatCard
        title="Net Cash Flow"
        value={formatCurrency({ number: stats?.netCashFlow ?? 0, maxFractionDigits: 0 })}
        description="Income - Expenses"
        comparisonLabel={comparisonLabel}
        icon={DollarSign}
        growth={stats?.netCashFlowGrowth}
        isLoading={isLoading}
        color="text-blue-500"
      />
    </Box>
  );
}
