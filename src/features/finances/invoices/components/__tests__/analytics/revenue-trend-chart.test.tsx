// @vitest-environment happy-dom

import React from 'react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { RevenueTrend } from '@/features/finances/invoices/types';

// -- Mocks ------------------------------------------------------------------

vi.mock('recharts', () => ({
  BarChart: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid='bar-chart'>{children}</div>
  ),
  Bar: () => <div data-testid='bar' />,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null
}));

vi.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid='chart-container'>{children}</div>
  ),
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
  ChartLegend: () => null
}));

vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  return {
    ...actual,
    formatCurrency: ({ number }: { number: number }) => `$${number}`
  };
});

// Intercept next/dynamic and capture the inner component from the loader so
// tests render it directly, bypassing Next.js dynamic import machinery.
type ChartProps = { data?: RevenueTrend[]; isLoading?: boolean };
let capturedLoader: (() => Promise<{ default: React.ComponentType<ChartProps> }>) | null = null;

vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<{ default: React.ComponentType<ChartProps> }>) => {
    capturedLoader = loader;
    // Return a simple passthrough — tests will render CapturedInner directly
    return function DynamicStub() {
      return <div data-testid='dynamic-stub' />;
    };
  }
}));

// -- Subject ----------------------------------------------------------------

// Inner component resolved from the loader captured above
let InnerChart: React.ComponentType<ChartProps>;

beforeAll(async () => {
  // Import the module — this triggers the dynamic() call which sets capturedLoader
  await import('../../analytics/revenue-trend-chart');

  if (!capturedLoader) throw new Error('next/dynamic was not called during module load');
  const result = await capturedLoader();
  // next/dynamic loaders called with Promise.resolve(Component) resolve to
  // the component directly; those wrapping a real import resolve to {default}.
  if (typeof result === 'function') {
    InnerChart = result as React.ComponentType<ChartProps>;
  } else if (result && typeof (result as { default: unknown }).default === 'function') {
    InnerChart = (result as { default: React.ComponentType<ChartProps> }).default;
  } else {
    throw new Error(`Unexpected loader result: ${JSON.stringify(result)}`);
  }
});

// -- Helpers ----------------------------------------------------------------

function makeTrend(overrides: Partial<RevenueTrend> = {}): RevenueTrend {
  return { month: 'Jan', total: 10000, paid: 7000, ...overrides };
}

// -- Tests ------------------------------------------------------------------

describe('RevenueTrendChart', () => {
  // -- Loading state --------------------------------------------------------

  describe('loading state', () => {
    it('does not render the Revenue Trend heading when isLoading is true', () => {
      render(<InnerChart isLoading />);

      expect(screen.queryByText('Revenue Trend')).not.toBeInTheDocument();
    });

    it('does not render the chart container when isLoading is true', () => {
      render(<InnerChart isLoading />);

      expect(screen.queryByTestId('chart-container')).not.toBeInTheDocument();
    });
  });

  // -- Rendering ------------------------------------------------------------

  describe('rendering', () => {
    it('renders the Revenue Trend card title', () => {
      render(<InnerChart data={[makeTrend()]} />);

      expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
    });

    it('renders the card description', () => {
      render(<InnerChart data={[makeTrend()]} />);

      expect(
        screen.getByText(/monthly comparison of total invoiced vs\. actual collected revenue/i)
      ).toBeInTheDocument();
    });

    it('renders the chart container', () => {
      render(<InnerChart data={[makeTrend()]} />);

      expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    });

    it('renders the bar chart', () => {
      render(<InnerChart data={[makeTrend()]} />);

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('renders with undefined data without crashing', () => {
      render(<InnerChart />);

      expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
    });

    it('renders with an empty data array without crashing', () => {
      render(<InnerChart data={[]} />);

      expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
    });

    it('renders with multiple trend data points without crashing', () => {
      const data = [
        makeTrend({ month: 'Jan' }),
        makeTrend({ month: 'Feb' }),
        makeTrend({ month: 'Mar' })
      ];

      render(<InnerChart data={data} />);

      expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    });
  });
});
