'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ModuleCard } from './module-card';
import { CashFlowWaterfallChart } from './cash-flow-waterfall-chart';
import { RecentActivity } from './recent-activity';
import { FinancialHealth } from './financial-health';
import { useInvoiceStatistics } from '@/features/finances/invoices/hooks/use-invoice-queries';
import { useQuoteStatistics } from '@/features/finances/quotes/hooks/use-quote-queries';
import { useTransactionStatistics } from '@/features/finances/transactions/hooks/use-transaction-queries';
import { FileText, FileCheck, Receipt, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function FinancesOverview() {
  const router = useRouter();

  // Fetch summary statistics for all modules
  const { data: invoiceStats, isLoading: invoiceStatsLoading } = useInvoiceStatistics();
  const { data: quoteStats, isLoading: quoteStatsLoading } = useQuoteStatistics();
  const { data: transactionStats, isLoading: transactionStatsLoading } = useTransactionStatistics();

  // Calculate metrics
  const collectionRate = invoiceStats
    ? (
        (invoiceStats.totalRevenue /
          (invoiceStats.totalRevenue + invoiceStats.pendingRevenue || 1)) *
        100
      ).toFixed(0)
    : '0';

  const acceptanceRate = quoteStats ? (quoteStats.acceptanceRate?.toFixed(0) ?? '0') : '0';

  // Prepare chart data for mini charts (last 30 days simulation)
  const invoiceChartData = useMemo(() => {
    if (!invoiceStats?.revenueTrend) return [];
    return invoiceStats.revenueTrend.slice(-30).map((item) => ({ value: item.paid }));
  }, [invoiceStats]);

  const quoteChartData = useMemo(() => {
    if (!quoteStats?.quoteTrend) return [];
    return quoteStats.quoteTrend.slice(-30).map((item) => ({ value: item.totalValue }));
  }, [quoteStats]);

  const transactionChartData = useMemo(() => {
    if (!transactionStats) return [];
    // Generate sample data for demonstration
    return Array.from({ length: 30 }, (_, i) => ({
      value: ((transactionStats.totalIncome || 0) * (0.8 + Math.random() * 0.4)) / 30,
    }));
  }, [transactionStats]);

  // Prepare financial health metrics
  const healthMetrics = useMemo(() => {
    if (!invoiceStats || !quoteStats || !transactionStats) return [];

    return [
      {
        label: 'Collection Rate',
        value: parseFloat(collectionRate),
        max: 100,
        percentage: parseFloat(collectionRate),
        format: 'percentage' as const,
      },
      {
        label: 'Quote Acceptance',
        value: parseFloat(acceptanceRate),
        max: 100,
        percentage: parseFloat(acceptanceRate),
        format: 'percentage' as const,
      },
      {
        label: 'Cash Flow Health',
        value: transactionStats.netCashFlow,
        max: transactionStats.totalIncome || 1,
        percentage: (transactionStats.netCashFlow / (transactionStats.totalIncome || 1)) * 100,
        format: 'currency' as const,
      },
    ];
  }, [invoiceStats, quoteStats, transactionStats, collectionRate, acceptanceRate]);

  // TODO: Fetch recent activity from all modules
  const recentActivity = useMemo(() => [], []);

  return (
    <div className="space-y-8">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finances Overview</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your business financial health across all modules
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => router.push('/finances/invoices/new')}>
            <FileText className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
          <Button variant="outline" onClick={() => router.push('/finances/quotes/new')}>
            <FileCheck className="h-4 w-4 mr-2" />
            New Quote
          </Button>
          <Button variant="outline" onClick={() => router.push('/finances/transactions/new')}>
            <Receipt className="h-4 w-4 mr-2" />
            New Transaction
          </Button>
        </div>
      </div>

      {/* Module Cards - 3 Large Visual Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Invoices Module Card */}
        <ModuleCard
          title="Invoices"
          icon={FileText}
          iconColor="text-emerald-600"
          primaryMetric={{
            label: 'Total Revenue',
            value: formatCurrency({
              number: invoiceStats?.totalRevenue ?? 0,
              maxFractionDigits: 0,
            }),
            growth: invoiceStats?.totalRevenueGrowth,
          }}
          secondaryMetrics={[
            {
              label: 'Outstanding',
              value: formatCurrency({
                number: invoiceStats?.pendingRevenue ?? 0,
                maxFractionDigits: 0,
              }),
            },
            {
              label: 'Collection Rate',
              value: `${collectionRate}%`,
            },
          ]}
          chartData={invoiceChartData}
          href="/finances/invoices"
          isLoading={invoiceStatsLoading}
        />

        {/* Quotes Module Card */}
        <ModuleCard
          title="Quotes"
          icon={FileCheck}
          iconColor="text-blue-600"
          primaryMetric={{
            label: 'Total Quoted',
            value: formatCurrency({
              number: quoteStats?.totalQuotedValue ?? 0,
              maxFractionDigits: 0,
            }),
            growth: quoteStats?.quotedValueGrowth,
          }}
          secondaryMetrics={[
            {
              label: 'Acceptance Rate',
              value: `${acceptanceRate}%`,
            },
            {
              label: 'Conversion Rate',
              value: `${quoteStats?.conversionRate?.toFixed(0) ?? 0}%`,
            },
          ]}
          chartData={quoteChartData}
          href="/finances/quotes"
          isLoading={quoteStatsLoading}
        />

        {/* Transactions Module Card */}
        <ModuleCard
          title="Transactions"
          icon={DollarSign}
          iconColor="text-purple-600"
          primaryMetric={{
            label: 'Net Cash Flow',
            value: formatCurrency({
              number: transactionStats?.netCashFlow ?? 0,
              maxFractionDigits: 0,
            }),
            growth: transactionStats?.netCashFlowGrowth,
          }}
          secondaryMetrics={[
            {
              label: 'Total Income',
              value: formatCurrency({
                number: transactionStats?.totalIncome ?? 0,
                maxFractionDigits: 0,
              }),
            },
            {
              label: 'Total Expenses',
              value: formatCurrency({
                number: transactionStats?.totalExpense ?? 0,
                maxFractionDigits: 0,
              }),
            },
          ]}
          chartData={transactionChartData}
          href="/finances/transactions"
          isLoading={transactionStatsLoading}
        />
      </div>

      {/* Combined Financial Chart */}
      <CashFlowWaterfallChart />

      {/* Bottom Row: Recent Activity + Financial Health */}
      <div className="grid gap-6 md:grid-cols-2">
        <RecentActivity items={recentActivity} isLoading={false} />
        <FinancialHealth
          metrics={healthMetrics}
          isLoading={invoiceStatsLoading || quoteStatsLoading || transactionStatsLoading}
        />
      </div>
    </div>
  );
}
