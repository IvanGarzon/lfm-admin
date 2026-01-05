'use client';

import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SummaryCard } from './summary-card';
import { AnalyticsSkeleton } from './analytics-skeleton';
import { useInvoiceStatistics } from '@/features/finances/invoices/hooks/use-invoice-queries';
import { useQuoteStatistics } from '@/features/finances/quotes/hooks/use-quote-queries';
import { useTransactionStatistics } from '@/features/finances/transactions/hooks/use-transaction-queries';
import {
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  FileText,
  Receipt,
  ArrowUpCircle,
  ArrowDownCircle,
  Activity,
  FileCheck,
  Percent,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Dynamic imports for lazy loading
const InvoiceAnalytics = dynamic(
  () =>
    import('@/features/finances/invoices/components/invoice-analytics').then((mod) => ({
      default: mod.InvoiceAnalytics,
    })),
  { ssr: false, loading: () => <AnalyticsSkeleton /> },
);

const QuoteAnalytics = dynamic(
  () =>
    import('@/features/finances/quotes/components/quote-analytics').then((mod) => ({
      default: mod.QuoteAnalytics,
    })),
  { ssr: false, loading: () => <AnalyticsSkeleton /> },
);

const TransactionAnalytics = dynamic(
  () =>
    import('@/features/finances/transactions/components/analytics/transaction-analytics').then(
      (mod) => ({
        default: mod.TransactionAnalytics,
      }),
    ),
  { ssr: false, loading: () => <AnalyticsSkeleton /> },
);

export function FinancesOverview() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('invoices');

  // Fetch summary statistics for overview
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

  const acceptanceRate = quoteStats ? (quoteStats.acceptanceRate?.toFixed(0) ?? '0') : '0';

  const conversionRate = quoteStats ? (quoteStats.conversionRate?.toFixed(0) ?? '0') : '0';

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

      {/* Summary Cards - 3x3 Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Invoice Summary */}
        <SummaryCard
          title="Total Revenue"
          value={formatCurrency({ number: invoiceStats?.totalRevenue ?? 0, maxFractionDigits: 0 })}
          href="/finances/invoices"
          icon={DollarSign}
          iconColor="text-emerald-500"
          isLoading={invoiceStatsLoading}
        />
        <SummaryCard
          title="Outstanding"
          value={formatCurrency({
            number: invoiceStats?.pendingRevenue ?? 0,
            maxFractionDigits: 0,
          })}
          href="/finances/invoices"
          icon={Clock}
          iconColor="text-yellow-500"
          isLoading={invoiceStatsLoading}
        />
        <SummaryCard
          title="Collection Rate"
          value={`${collectionRate}%`}
          href="/finances/invoices"
          icon={TrendingUp}
          iconColor="text-green-500"
          isLoading={invoiceStatsLoading}
        />

        {/* Quote Summary */}
        <SummaryCard
          title="Total Quoted"
          value={formatCurrency({
            number: quoteStats?.totalQuotedValue ?? 0,
            maxFractionDigits: 0,
          })}
          href="/finances/quotes"
          icon={FileCheck}
          iconColor="text-blue-500"
          isLoading={quoteStatsLoading}
        />
        <SummaryCard
          title="Acceptance Rate"
          value={`${acceptanceRate}%`}
          href="/finances/quotes"
          icon={Percent}
          iconColor="text-purple-500"
          isLoading={quoteStatsLoading}
        />
        <SummaryCard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          href="/finances/quotes"
          icon={TrendingUp}
          iconColor="text-indigo-500"
          isLoading={quoteStatsLoading}
        />

        {/* Transaction Summary */}
        <SummaryCard
          title="Total Income"
          value={formatCurrency({
            number: transactionStats?.totalIncome ?? 0,
            maxFractionDigits: 0,
          })}
          href="/finances/transactions"
          icon={ArrowUpCircle}
          iconColor="text-emerald-500"
          isLoading={transactionStatsLoading}
        />
        <SummaryCard
          title="Total Expenses"
          value={formatCurrency({
            number: transactionStats?.totalExpense ?? 0,
            maxFractionDigits: 0,
          })}
          href="/finances/transactions"
          icon={ArrowDownCircle}
          iconColor="text-red-500"
          isLoading={transactionStatsLoading}
        />
        <SummaryCard
          title="Net Cash Flow"
          value={formatCurrency({
            number: transactionStats?.netCashFlow ?? 0,
            maxFractionDigits: 0,
          })}
          href="/finances/transactions"
          icon={Activity}
          iconColor="text-blue-500"
          isLoading={transactionStatsLoading}
        />
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Suspense fallback={<AnalyticsSkeleton />}>
            <InvoiceAnalytics />
          </Suspense>
        </TabsContent>

        <TabsContent value="quotes">
          <Suspense fallback={<AnalyticsSkeleton />}>
            <QuoteAnalytics />
          </Suspense>
        </TabsContent>

        <TabsContent value="transactions">
          <Suspense fallback={<AnalyticsSkeleton />}>
            <TransactionAnalytics />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
