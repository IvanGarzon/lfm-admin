// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { InvoiceAnalytics } from '../invoice-analytics';
import type { InvoiceStatistics } from '../../types';
import { createInvoiceStatistics } from '@/lib/testing/factories/invoice.factory';
import type { DateRange } from 'react-day-picker';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/lib/utils', () => ({
  formatCurrency: ({ number }: { number: number }) => `$${number.toFixed(0)}`
}));

vi.mock('@/components/ui/box', () => ({
  Box: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  )
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    size?: string;
  }) => <button onClick={onClick}>{children}</button>
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid='skeleton' className={className} />
  )
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
}));

vi.mock('@/components/date-range-picker', () => ({
  CalendarDateRangePicker: ({
    date,
    onDateChange
  }: {
    date?: DateRange;
    onDateChange: (range: DateRange | undefined) => void;
  }) => (
    <div
      data-testid='date-range-picker'
      data-has-date={Boolean(date)}
      onClick={() => onDateChange(undefined)}
    />
  )
}));

vi.mock('@/features/finances/invoices/components/analytics/stat-card', () => ({
  StatCard: ({
    title,
    value,
    isLoading
  }: {
    title: string;
    value: string | number;
    description?: string;
    icon: unknown;
    isLoading?: boolean;
    color?: string;
  }) => (
    <div data-testid={`stat-card-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <span data-testid='stat-title'>{title}</span>
      <span data-testid='stat-value'>{value}</span>
      {isLoading && <span data-testid='stat-loading'>loading</span>}
    </div>
  )
}));

vi.mock('@/features/finances/invoices/components/analytics/top-debtors-list', () => ({
  TopDebtorsList: ({ debtors, isLoading }: { debtors?: unknown[]; isLoading: boolean }) => (
    <div
      data-testid='top-debtors-list'
      data-debtor-count={debtors?.length ?? 0}
      data-loading={isLoading}
    />
  )
}));

vi.mock('next/dynamic', () => ({
  default: (
    loader: () => Promise<{ default: React.ComponentType<unknown> }>,
    options?: { loading?: () => React.ReactElement }
  ) => {
    // Return a stub that renders based on the loader's module name via toString
    const loaderStr = loader.toString();
    if (loaderStr.includes('revenue-trend-chart')) {
      return function RevenueTrendChartStub({
        data,
        isLoading
      }: {
        data?: unknown[];
        isLoading: boolean;
      }) {
        return (
          <div
            data-testid='revenue-trend-chart'
            data-has-data={Boolean(data)}
            data-loading={isLoading}
          />
        );
      };
    }
    return function StatusDistributionChartStub({
      stats,
      isLoading
    }: {
      stats?: InvoiceStatistics;
      isLoading: boolean;
    }) {
      return (
        <div
          data-testid='status-distribution-chart'
          data-has-stats={Boolean(stats)}
          data-loading={isLoading}
        />
      );
    };
  }
}));

vi.mock('lucide-react', () => ({
  CheckCircle: () => <svg data-testid='icon-check-circle' />,
  Download: () => <svg data-testid='icon-download' />,
  FileEdit: () => <svg data-testid='icon-file-edit' />
}));

// -- Tests ------------------------------------------------------------------

describe('InvoiceAnalytics', () => {
  const onDateRangeChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Rendering with data --------------------------------------------------

  describe('rendering with data', () => {
    it('renders the Detailed Analytics heading', () => {
      render(
        <InvoiceAnalytics
          stats={createInvoiceStatistics()}
          isLoading={false}
          onDateRangeChange={onDateRangeChange}
          comparisonLabel='vs last month'
        />
      );

      expect(screen.getByRole('heading', { name: 'Detailed Analytics' })).toBeInTheDocument();
    });

    it('renders the Average Value stat card', () => {
      render(
        <InvoiceAnalytics
          stats={createInvoiceStatistics({ avgInvoiceValue: 750 })}
          isLoading={false}
          onDateRangeChange={onDateRangeChange}
          comparisonLabel=''
        />
      );

      expect(screen.getByTestId('stat-card-average-value')).toBeInTheDocument();
      expect(screen.getByTestId('stat-card-average-value')).toHaveTextContent('$750');
    });

    it('renders the Drafts stat card', () => {
      render(
        <InvoiceAnalytics
          stats={createInvoiceStatistics({ draft: 4 })}
          isLoading={false}
          onDateRangeChange={onDateRangeChange}
          comparisonLabel=''
        />
      );

      expect(screen.getByTestId('stat-card-drafts')).toBeInTheDocument();
      expect(screen.getByTestId('stat-card-drafts')).toHaveTextContent('4');
    });

    it('renders the date range picker', () => {
      render(
        <InvoiceAnalytics
          stats={createInvoiceStatistics()}
          isLoading={false}
          onDateRangeChange={onDateRangeChange}
          comparisonLabel=''
        />
      );

      expect(screen.getByTestId('date-range-picker')).toBeInTheDocument();
    });

    it('renders the top debtors list', () => {
      render(
        <InvoiceAnalytics
          stats={createInvoiceStatistics()}
          isLoading={false}
          onDateRangeChange={onDateRangeChange}
          comparisonLabel=''
        />
      );

      expect(screen.getByTestId('top-debtors-list')).toBeInTheDocument();
    });

    it('passes debtors from stats to TopDebtorsList', () => {
      const debtors = [
        { customerId: 'c1', customerName: 'Alice', amountDue: 300, invoiceCount: 1 }
      ];
      render(
        <InvoiceAnalytics
          stats={createInvoiceStatistics({ topDebtors: debtors })}
          isLoading={false}
          onDateRangeChange={onDateRangeChange}
          comparisonLabel=''
        />
      );

      expect(screen.getByTestId('top-debtors-list')).toHaveAttribute('data-debtor-count', '1');
    });
  });

  // -- Loading state --------------------------------------------------------

  describe('loading state', () => {
    it('passes isLoading=true to Average Value stat card', () => {
      render(
        <InvoiceAnalytics
          stats={undefined}
          isLoading={true}
          onDateRangeChange={onDateRangeChange}
          comparisonLabel=''
        />
      );

      expect(screen.getByTestId('stat-card-average-value')).toHaveTextContent('loading');
    });

    it('passes isLoading=true to Drafts stat card', () => {
      render(
        <InvoiceAnalytics
          stats={undefined}
          isLoading={true}
          onDateRangeChange={onDateRangeChange}
          comparisonLabel=''
        />
      );

      expect(screen.getByTestId('stat-card-drafts')).toHaveTextContent('loading');
    });

    it('passes isLoading=true to TopDebtorsList', () => {
      render(
        <InvoiceAnalytics
          stats={undefined}
          isLoading={true}
          onDateRangeChange={onDateRangeChange}
          comparisonLabel=''
        />
      );

      expect(screen.getByTestId('top-debtors-list')).toHaveAttribute('data-loading', 'true');
    });
  });

  // -- Undefined/null stats -------------------------------------------------

  describe('when stats are undefined', () => {
    it('renders zero for avgInvoiceValue', () => {
      render(
        <InvoiceAnalytics
          stats={undefined}
          isLoading={false}
          onDateRangeChange={onDateRangeChange}
          comparisonLabel=''
        />
      );

      expect(screen.getByTestId('stat-card-average-value')).toHaveTextContent('$0');
    });

    it('renders zero for draft count', () => {
      render(
        <InvoiceAnalytics
          stats={undefined}
          isLoading={false}
          onDateRangeChange={onDateRangeChange}
          comparisonLabel=''
        />
      );

      expect(screen.getByTestId('stat-card-drafts')).toHaveTextContent('0');
    });

    it('passes zero debtors to TopDebtorsList', () => {
      render(
        <InvoiceAnalytics
          stats={undefined}
          isLoading={false}
          onDateRangeChange={onDateRangeChange}
          comparisonLabel=''
        />
      );

      expect(screen.getByTestId('top-debtors-list')).toHaveAttribute('data-debtor-count', '0');
    });
  });

  // -- Date range interaction -----------------------------------------------

  describe('date range interaction', () => {
    it('passes the dateRange prop to CalendarDateRangePicker', () => {
      const dateRange: DateRange = {
        from: new Date('2025-01-01'),
        to: new Date('2025-01-31')
      };
      render(
        <InvoiceAnalytics
          stats={createInvoiceStatistics()}
          isLoading={false}
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
          comparisonLabel=''
        />
      );

      expect(screen.getByTestId('date-range-picker')).toHaveAttribute('data-has-date', 'true');
    });

    it('calls onDateRangeChange when the date range picker fires', () => {
      render(
        <InvoiceAnalytics
          stats={createInvoiceStatistics()}
          isLoading={false}
          onDateRangeChange={onDateRangeChange}
          comparisonLabel=''
        />
      );

      fireEvent.click(screen.getByTestId('date-range-picker'));

      expect(onDateRangeChange).toHaveBeenCalledWith(undefined);
    });
  });

  // -- Export button --------------------------------------------------------

  describe('export button', () => {
    it('renders the Export button', () => {
      render(
        <InvoiceAnalytics
          stats={createInvoiceStatistics()}
          isLoading={false}
          onDateRangeChange={onDateRangeChange}
          comparisonLabel=''
        />
      );

      expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument();
    });
  });
});
