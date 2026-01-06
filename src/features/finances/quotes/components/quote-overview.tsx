'use client';

import { DollarSign, CheckCircle, Percent } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { StatCard } from '@/features/finances/invoices/components/analytics/stat-card';
import { QuoteStatistics } from '@/features/finances/quotes/types';

interface QuoteOverviewProps {
  stats?: QuoteStatistics;
  isLoading: boolean;
  comparisonLabel: string;
}

export function QuoteOverview({ stats, isLoading, comparisonLabel }: QuoteOverviewProps) {
  return (
    <Box className="grid gap-4 md:grid-cols-3">
      <StatCard
        title="Total Quoted"
        value={formatCurrency({ number: stats?.totalQuotedValue ?? 0, maxFractionDigits: 0 })}
        description="Total value of all quotes"
        comparisonLabel={comparisonLabel}
        icon={DollarSign}
        isLoading={isLoading}
        color="text-blue-500"
      />
      <StatCard
        title="Accepted Value"
        value={formatCurrency({ number: stats?.totalAcceptedValue ?? 0, maxFractionDigits: 0 })}
        description="Value of accepted quotes"
        comparisonLabel={comparisonLabel}
        icon={CheckCircle}
        isLoading={isLoading}
        color="text-emerald-500"
      />
      <StatCard
        title="Conversion Rate"
        value={`${stats?.conversionRate.toFixed(1) ?? 0}%`}
        description="Accepted / Sent"
        icon={Percent}
        isLoading={isLoading}
        color="text-green-500"
      />
    </Box>
  );
}
