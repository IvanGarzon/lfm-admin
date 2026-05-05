// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { InvoiceOverview } from '../invoice-overview';
import { createInvoiceStatistics } from '@/lib/testing/factories/invoice.factory';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/lib/utils', () => ({
  formatCurrency: ({ number }: { number: number; maxFractionDigits?: number }) =>
    `$${number.toFixed(0)}`
}));

vi.mock('@/components/ui/box', () => ({
  Box: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  )
}));

vi.mock('@/features/finances/invoices/components/analytics/stat-card', () => ({
  StatCard: ({
    title,
    value,
    isLoading,
    growth,
    comparisonLabel
  }: {
    title: string;
    value: string | number;
    description?: string;
    comparisonLabel?: string;
    icon: unknown;
    growth?: number;
    isLoading?: boolean;
    color?: string;
  }) => (
    <div data-testid={`stat-card-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <span data-testid='stat-title'>{title}</span>
      <span data-testid='stat-value'>{value}</span>
      {isLoading && <span data-testid='stat-loading'>loading</span>}
      {growth !== undefined && <span data-testid='stat-growth'>{growth}</span>}
      {comparisonLabel && <span data-testid='stat-comparison'>{comparisonLabel}</span>}
    </div>
  )
}));

// -- Tests ------------------------------------------------------------------

describe('InvoiceOverview', () => {
  // -- Rendering ------------------------------------------------------------

  describe('rendering', () => {
    it('renders three stat cards', () => {
      render(
        <InvoiceOverview
          stats={createInvoiceStatistics()}
          isLoading={false}
          comparisonLabel='vs last month'
        />
      );

      expect(screen.getByTestId('stat-card-total-revenue')).toBeInTheDocument();
      expect(screen.getByTestId('stat-card-outstanding')).toBeInTheDocument();
      expect(screen.getByTestId('stat-card-collection-rate')).toBeInTheDocument();
    });

    it('displays formatted total revenue', () => {
      render(
        <InvoiceOverview
          stats={createInvoiceStatistics({ totalRevenue: 5000 })}
          isLoading={false}
          comparisonLabel=''
        />
      );

      const revenueCard = screen.getByTestId('stat-card-total-revenue');
      expect(revenueCard).toHaveTextContent('$5000');
    });

    it('displays formatted outstanding (pending) revenue', () => {
      render(
        <InvoiceOverview
          stats={createInvoiceStatistics({ pendingRevenue: 2000 })}
          isLoading={false}
          comparisonLabel=''
        />
      );

      const outstandingCard = screen.getByTestId('stat-card-outstanding');
      expect(outstandingCard).toHaveTextContent('$2000');
    });

    it('displays zero revenue when stats are undefined', () => {
      render(<InvoiceOverview stats={undefined} isLoading={false} comparisonLabel='' />);

      expect(screen.getByTestId('stat-card-total-revenue')).toHaveTextContent('$0');
      expect(screen.getByTestId('stat-card-outstanding')).toHaveTextContent('$0');
    });

    it('passes comparisonLabel to stat cards', () => {
      render(
        <InvoiceOverview
          stats={createInvoiceStatistics()}
          isLoading={false}
          comparisonLabel='vs last month'
        />
      );

      const labels = screen.getAllByTestId('stat-comparison');
      expect(labels.length).toBeGreaterThan(0);
      expect(labels[0]).toHaveTextContent('vs last month');
    });
  });

  // -- Collection rate calculation ------------------------------------------

  describe('collection rate', () => {
    it('calculates collection rate as totalRevenue / (totalRevenue + pendingRevenue)', () => {
      render(
        <InvoiceOverview
          stats={createInvoiceStatistics({ totalRevenue: 3000, pendingRevenue: 1000 })}
          isLoading={false}
          comparisonLabel=''
        />
      );

      // 3000 / (3000 + 1000) * 100 = 75%
      expect(screen.getByTestId('stat-card-collection-rate')).toHaveTextContent('75%');
    });

    it('shows 0% collection rate when both revenue values are zero', () => {
      render(
        <InvoiceOverview
          stats={createInvoiceStatistics({ totalRevenue: 0, pendingRevenue: 0 })}
          isLoading={false}
          comparisonLabel=''
        />
      );

      expect(screen.getByTestId('stat-card-collection-rate')).toHaveTextContent('0%');
    });

    it('shows 0% collection rate when stats are undefined', () => {
      render(<InvoiceOverview stats={undefined} isLoading={false} comparisonLabel='' />);

      expect(screen.getByTestId('stat-card-collection-rate')).toHaveTextContent('0%');
    });

    it('shows 100% collection rate when there is no pending revenue', () => {
      render(
        <InvoiceOverview
          stats={createInvoiceStatistics({ totalRevenue: 5000, pendingRevenue: 0 })}
          isLoading={false}
          comparisonLabel=''
        />
      );

      expect(screen.getByTestId('stat-card-collection-rate')).toHaveTextContent('100%');
    });
  });

  // -- Loading state --------------------------------------------------------

  describe('loading state', () => {
    it('passes isLoading=true to stat cards when loading', () => {
      render(<InvoiceOverview stats={undefined} isLoading={true} comparisonLabel='' />);

      const loadingIndicators = screen.getAllByTestId('stat-loading');
      expect(loadingIndicators).toHaveLength(3);
    });

    it('does not show loading indicators when isLoading is false', () => {
      render(
        <InvoiceOverview stats={createInvoiceStatistics()} isLoading={false} comparisonLabel='' />
      );

      expect(screen.queryByTestId('stat-loading')).not.toBeInTheDocument();
    });
  });

  // -- Growth indicators ----------------------------------------------------

  describe('growth indicators', () => {
    it('passes totalRevenueGrowth to the Total Revenue stat card', () => {
      render(
        <InvoiceOverview
          stats={createInvoiceStatistics({ totalRevenueGrowth: 12 })}
          isLoading={false}
          comparisonLabel=''
        />
      );

      const revenueCard = screen.getByTestId('stat-card-total-revenue');
      expect(revenueCard.querySelector('[data-testid="stat-growth"]')).toHaveTextContent('12');
    });

    it('passes pendingRevenueGrowth to the Outstanding stat card', () => {
      render(
        <InvoiceOverview
          stats={createInvoiceStatistics({ pendingRevenueGrowth: -5 })}
          isLoading={false}
          comparisonLabel=''
        />
      );

      const outstandingCard = screen.getByTestId('stat-card-outstanding');
      expect(outstandingCard.querySelector('[data-testid="stat-growth"]')).toHaveTextContent('-5');
    });
  });
});
