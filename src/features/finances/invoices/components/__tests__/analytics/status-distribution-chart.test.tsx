// @vitest-environment happy-dom

import React from 'react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { InvoiceStatistics } from '@/features/finances/invoices/types';
import { createInvoiceStatistics } from '@/lib/testing/factories/invoice.factory';

// -- Mocks ------------------------------------------------------------------

vi.mock('recharts', () => ({
  PieChart: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid='pie-chart'>{children}</div>
  ),
  Pie: ({ data }: { data?: { status: string; count: number }[] }) => (
    <div data-testid='pie' data-count={data?.length ?? 0} />
  ),
  Label: () => null
}));

vi.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid='chart-container'>{children}</div>
  ),
  ChartTooltip: () => null,
  ChartTooltipContent: () => null
}));

// Intercept next/dynamic and capture the inner component from the loader so
// tests render it directly, bypassing Next.js dynamic import machinery.
type ChartProps = { stats?: InvoiceStatistics; isLoading?: boolean };
let capturedLoader: (() => Promise<unknown>) | null = null;

vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<unknown>) => {
    capturedLoader = loader;
    return function DynamicStub() {
      return <div data-testid='dynamic-stub' />;
    };
  }
}));

// -- Subject ----------------------------------------------------------------

let InnerChart: React.ComponentType<ChartProps>;

beforeAll(async () => {
  await import('../../analytics/status-distribution-chart');

  if (!capturedLoader) throw new Error('next/dynamic was not called during module load');
  const result = await capturedLoader();

  if (typeof result === 'function') {
    InnerChart = result as React.ComponentType<ChartProps>;
  } else if (result && typeof (result as { default: unknown }).default === 'function') {
    InnerChart = (result as { default: React.ComponentType<ChartProps> }).default;
  } else {
    throw new Error(`Unexpected loader result: ${JSON.stringify(result)}`);
  }
});

// -- Helpers ----------------------------------------------------------------

function makeEmptyStats(): InvoiceStatistics {
  return createInvoiceStatistics({
    total: 0,
    draft: 0,
    pending: 0,
    paid: 0,
    overdue: 0,
    cancelled: 0,
    partiallyPaid: 0
  });
}

// -- Tests ------------------------------------------------------------------

describe('StatusDistributionChart', () => {
  // -- Loading state --------------------------------------------------------

  describe('loading state', () => {
    it('does not render the Status Distribution heading when isLoading is true', () => {
      render(<InnerChart isLoading />);

      expect(screen.queryByText('Status Distribution')).not.toBeInTheDocument();
    });

    it('does not render the chart when isLoading is true', () => {
      render(<InnerChart isLoading />);

      expect(screen.queryByTestId('chart-container')).not.toBeInTheDocument();
    });
  });

  // -- Empty / no data ------------------------------------------------------

  describe('empty / no data', () => {
    it('renders empty message when stats is undefined', () => {
      render(<InnerChart />);

      expect(screen.getByText('No invoices found for this period')).toBeInTheDocument();
    });

    it('renders empty message when all statuses have zero counts', () => {
      render(<InnerChart stats={makeEmptyStats()} />);

      expect(screen.getByText('No invoices found for this period')).toBeInTheDocument();
    });

    it('does not render the chart when there is no data', () => {
      render(<InnerChart stats={makeEmptyStats()} />);

      expect(screen.queryByTestId('chart-container')).not.toBeInTheDocument();
    });

    it('still renders the Status Distribution heading in empty state', () => {
      render(<InnerChart stats={makeEmptyStats()} />);

      expect(screen.getByText('Status Distribution')).toBeInTheDocument();
    });
  });

  // -- Rendering with data --------------------------------------------------

  describe('rendering with data', () => {
    it('renders the Status Distribution card title', () => {
      render(<InnerChart stats={createInvoiceStatistics()} />);

      expect(screen.getByText('Status Distribution')).toBeInTheDocument();
    });

    it('renders the chart container', () => {
      render(<InnerChart stats={createInvoiceStatistics()} />);

      expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    });

    it('renders the pie chart', () => {
      render(<InnerChart stats={createInvoiceStatistics()} />);

      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('renders legend labels for non-zero statuses', () => {
      render(
        <InnerChart
          stats={createInvoiceStatistics({
            draft: 2,
            pending: 3,
            paid: 4,
            overdue: 1,
            cancelled: 0,
            partiallyPaid: 0
          })}
        />
      );

      expect(screen.getByText(/draft/i)).toBeInTheDocument();
      expect(screen.getByText(/pending/i)).toBeInTheDocument();
      expect(screen.getByText(/paid/i)).toBeInTheDocument();
      expect(screen.getByText(/overdue/i)).toBeInTheDocument();
    });

    it('does not render legend label for statuses with zero count', () => {
      render(<InnerChart stats={createInvoiceStatistics({ cancelled: 0 })} />);

      expect(screen.queryByText(/cancelled/i)).not.toBeInTheDocument();
    });

    it('renders a 100% percentage for a single-status dataset', () => {
      render(
        <InnerChart
          stats={createInvoiceStatistics({
            total: 4,
            paid: 4,
            draft: 0,
            pending: 0,
            overdue: 0,
            cancelled: 0,
            partiallyPaid: 0
          })}
        />
      );

      expect(screen.getByText(/100%/)).toBeInTheDocument();
    });

    it('renders without crashing when only one status has data', () => {
      render(
        <InnerChart
          stats={createInvoiceStatistics({
            total: 5,
            paid: 5,
            draft: 0,
            pending: 0,
            overdue: 0,
            cancelled: 0,
            partiallyPaid: 0
          })}
        />
      );

      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
  });
});
