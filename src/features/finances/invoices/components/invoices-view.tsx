'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo, useCallback } from 'react';
import { Plus, FileText } from 'lucide-react';
import { subDays, startOfMonth } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { SearchParams } from 'nuqs/server';
import { EmptyState } from '@/components/shared/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { InvoiceList } from '@/features/finances/invoices/components/invoice-list';
import { InvoiceOverview } from '@/features/finances/invoices/components/invoice-overview';
import { InvoiceAnalytics } from '@/features/finances/invoices/components/invoice-analytics';
import { useInvoiceStatistics } from '@/features/finances/invoices/hooks/use-invoice-queries';
import type { InvoicePagination } from '@/features/finances/invoices/types';

interface InvoicesViewProps {
  initialData: InvoicePagination;
  searchParams: SearchParams;
}

const InvoiceDrawer = dynamic(
  () =>
    import('@/features/finances/invoices/components/invoice-drawer').then(
      (mod) => mod.InvoiceDrawer,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

export function InvoicesView({ initialData, searchParams }: InvoicesViewProps) {
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('list');

  // Use useMemo to ensure stable date between server and client renders
  const today = useMemo(() => new Date(), []);

  // Date range for Analytics (default last 30 days)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => ({
    from: subDays(today, 30),
    to: today,
  }));

  // Current month filter for Overview (1st of month to today)
  const currentMonthFilter = useMemo(
    () => ({
      startDate: startOfMonth(today),
      endDate: today,
    }),
    [today],
  );

  // Stats for Overview (current month)
  const { data: overviewStats, isLoading: overviewLoading } =
    useInvoiceStatistics(currentMonthFilter);

  // Stats for Analytics (custom date range)
  const { data: analyticsStats, isLoading: analyticsLoading } = useInvoiceStatistics({
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

  const handleShowCreateModal = useCallback(() => {
    setShowCreateModal((prev) => !prev);
  }, []);

  const hasActiveFilters = Boolean(searchParams.search) || Boolean(searchParams.status);
  const isZeroState = initialData.pagination.totalItems === 0 && !hasActiveFilters;

  return (
    <Box className="space-y-4 min-w-0 w-full">
      {isZeroState ? (
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Add your first invoice to start managing your invoices."
          action={
            <Button onClick={handleShowCreateModal}>
              <Plus aria-hidden="true" className="h-4 w-4" />
              Add Invoice
            </Button>
          }
        />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <Box className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <Box className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
              <p className="text-muted-foreground text-sm">Manage and track all your invoices</p>
            </Box>
            <Box className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center shrink-0">
              <TabsList className="grid w-full grid-cols-2 sm:w-[200px]">
                <TabsTrigger value="list">List</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
              <Button onClick={handleShowCreateModal} className="w-full sm:w-auto">
                <Plus aria-hidden="true" className="h-4 w-4" />
                New Invoice
              </Button>
            </Box>
          </Box>

          <InvoiceOverview
            stats={overviewStats}
            isLoading={overviewLoading}
            comparisonLabel="vs. last month"
          />

          <TabsContent
            value="list"
            className="space-y-4 pt-2 border-none p-0 outline-none focus-visible:ring-0"
          >
            <InvoiceList data={initialData} searchParams={searchParams} />
          </TabsContent>

          <TabsContent
            value="analytics"
            className="space-y-4 pt-2 border-none p-0 outline-none focus-visible:ring-0"
          >
            <InvoiceAnalytics
              stats={analyticsStats}
              isLoading={analyticsLoading}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              comparisonLabel={comparisonLabel}
            />
          </TabsContent>
        </Tabs>
      )}

      {showCreateModal ? (
        <InvoiceDrawer open={showCreateModal} onClose={handleShowCreateModal} />
      ) : null}
    </Box>
  );
}
