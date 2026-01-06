import { useMemo } from 'react';
import { DollarSign, Clock, Percent } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { StatCard } from '@/features/finances/invoices/components/analytics/stat-card';
import { InvoiceStatistics } from '@/features/finances/invoices/types';

interface InvoiceOverviewProps {
  stats?: InvoiceStatistics;
  isLoading: boolean;
  comparisonLabel: string;
}

export function InvoiceOverview({ stats, isLoading, comparisonLabel }: InvoiceOverviewProps) {
  const collectionRate = useMemo(() => {
    if (!stats) return 0;
    const totalPotential = stats.totalRevenue + stats.pendingRevenue;
    return totalPotential > 0 ? (stats.totalRevenue / totalPotential) * 100 : 0;
  }, [stats]);

  return (
    <Box className="grid gap-4 md:grid-cols-3">
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
    </Box>
  );
}
