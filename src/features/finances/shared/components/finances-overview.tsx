'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, FileCheck, Receipt, DollarSign } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import {
  useInvoiceStatistics,
  useInvoices,
} from '@/features/finances/invoices/hooks/use-invoice-queries';
import { useQuoteStatistics, useQuotes } from '@/features/finances/quotes/hooks/use-quote-queries';
import {
  useTransactionStatistics,
  useTransactions,
} from '@/features/finances/transactions/hooks/use-transaction-queries';
import { formatCurrency } from '@/lib/utils';
import { RecentActivity } from './recent-activity';
import { FinancialHealth } from './financial-health';
import ModuleCard from './module-card';
import CashFlowWaterfallChart from './cash-flow-waterfall-chart';

export function FinancesOverview() {
  const router = useRouter();

  const { data: invoiceStats, isLoading: invoiceStatsLoading } = useInvoiceStatistics();
  const { data: quoteStats, isLoading: quoteStatsLoading } = useQuoteStatistics();
  const { data: transactionStats, isLoading: transactionStatsLoading } = useTransactionStatistics();

  const collectionRate = invoiceStats
    ? (
        (invoiceStats.totalRevenue /
          (invoiceStats.totalRevenue + invoiceStats.pendingRevenue || 1)) *
        100
      ).toFixed(0)
    : '0';

  const acceptanceRate = quoteStats ? quoteStats.acceptanceRate.toFixed(0) : '0';

  const invoiceChartData = useMemo(() => {
    if (!invoiceStats?.revenueTrend) return [];
    return invoiceStats.revenueTrend.slice(-30).map((item) => ({ value: item.paid }));
  }, [invoiceStats]);

  const quoteChartData = useMemo(() => {
    if (!quoteStats?.quoteTrend) return [];
    return quoteStats.quoteTrend.slice(-30).map((item) => ({ value: item.total }));
  }, [quoteStats]);

  const transactionChartData = useMemo(() => {
    if (!transactionStats) return [];
    // Generate sample data for demonstration
    return Array.from({ length: 30 }, () => ({
      value: ((transactionStats.totalIncome || 0) * (0.8 + Math.random() * 0.4)) / 30,
    }));
  }, [transactionStats]);

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

  const recentFilter = { page: 1, perPage: 5, sort: [{ id: 'issuedDate', desc: true }] };
  const recentTransactionFilter = { page: 1, perPage: 5, sort: [{ id: 'date', desc: true }] };

  const { data: recentInvoices } = useInvoices(recentFilter);
  const { data: recentQuotes } = useQuotes(recentFilter);
  const { data: recentTransactions } = useTransactions(recentTransactionFilter);

  const recentActivity = useMemo(() => {
    const invoiceItems = (recentInvoices?.items ?? []).map((inv) => ({
      id: inv.id,
      type: 'invoice' as const,
      title: inv.invoiceNumber,
      subtitle: inv.customerName,
      amount: Number(inv.amount),
      date: new Date(inv.issuedDate),
      status: inv.status,
    }));

    const quoteItems = (recentQuotes?.items ?? []).map((q) => ({
      id: q.id,
      type: 'quote' as const,
      title: q.quoteNumber,
      subtitle: q.customerName,
      amount: Number(q.amount),
      date: new Date(q.issuedDate),
      status: q.status,
    }));

    const transactionItems = (recentTransactions?.items ?? []).map((t) => ({
      id: t.id,
      type: 'transaction' as const,
      title: t.description,
      subtitle: t.payee,
      amount: Number(t.amount),
      date: new Date(t.date),
      status: t.status,
    }));

    return [...invoiceItems, ...quoteItems, ...transactionItems]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  }, [recentInvoices, recentQuotes, recentTransactions]);

  return (
    <Box className="space-y-8">
      {/* Header with Quick Actions */}
      <Box className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Box>
          <h1 className="text-3xl font-bold tracking-tight">Finances Overview</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your business financial health across all modules
          </p>
        </Box>
        <Box className="flex flex-wrap gap-2">
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
        </Box>
      </Box>

      <Box className="grid gap-6 md:grid-cols-3">
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
      </Box>

      <CashFlowWaterfallChart />

      <Box className="grid gap-6 md:grid-cols-2">
        <RecentActivity
          items={recentActivity}
          isLoading={!recentInvoices && !recentQuotes && !recentTransactions}
        />
        <FinancialHealth
          metrics={healthMetrics}
          isLoading={invoiceStatsLoading || quoteStatsLoading || transactionStatsLoading}
        />
      </Box>
    </Box>
  );
}
