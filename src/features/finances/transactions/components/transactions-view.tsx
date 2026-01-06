'use client';

import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { subDays, startOfMonth } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { TransactionList } from '@/features/finances/transactions/components/transaction-list';
import { TransactionOverview } from '@/features/finances/transactions/components/transaction-overview';
import { TransactionAnalytics } from '@/features/finances/transactions/components/analytics/transaction-analytics';
import { useTransactionStatistics } from '@/features/finances/transactions/hooks/use-transaction-queries';
import dynamic from 'next/dynamic';

interface TransactionsViewProps {
  initialData: any;
  searchParams: any;
}

const TransactionDrawer = dynamic(
  () =>
    import('@/features/finances/transactions/components/transaction-drawer').then(
      (mod) => mod.TransactionDrawer,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

export function TransactionsView({ initialData, searchParams }: TransactionsViewProps) {
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('list');

  // Date range for Analytics (default last 30 days)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // Current month filter for Overview (1st of month to today)
  const currentMonthFilter = useMemo(
    () => ({
      startDate: startOfMonth(new Date()),
      endDate: new Date(),
    }),
    [],
  );

  // Stats for Overview (current month)
  const { data: overviewStats, isLoading: overviewLoading } =
    useTransactionStatistics(currentMonthFilter);

  // Stats for Analytics (custom date range)
  const { data: analyticsStats, isLoading: analyticsLoading } = useTransactionStatistics({
    startDate: dateRange?.from,
    endDate: dateRange?.to,
  });

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

  const handleShowCreateModal = () => {
    setShowCreateModal((prev) => !prev);
  };

  return (
    <Box className="space-y-4 min-w-0 w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <Box className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <Box className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground text-sm">Track all your income and expenses</p>
          </Box>
          <Box className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center shrink-0">
            <TabsList className="grid w-full grid-cols-2 sm:w-[200px]">
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            <Button onClick={handleShowCreateModal} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Transaction
            </Button>
          </Box>
        </Box>

        <TransactionOverview
          stats={overviewStats}
          isLoading={overviewLoading}
          comparisonLabel="vs. last month"
        />

        <TabsContent
          value="list"
          className="space-y-4 pt-2 border-none p-0 outline-none focus-visible:ring-0"
        >
          <TransactionList data={initialData} searchParams={searchParams} />
        </TabsContent>

        <TabsContent
          value="analytics"
          className="space-y-4 pt-2 border-none p-0 outline-none focus-visible:ring-0"
        >
          <TransactionAnalytics
            stats={analyticsStats}
            isLoading={analyticsLoading}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            comparisonLabel={comparisonLabel}
          />
        </TabsContent>
      </Tabs>

      {showCreateModal ? (
        <TransactionDrawer open={showCreateModal} onClose={handleShowCreateModal} />
      ) : null}
    </Box>
  );
}
