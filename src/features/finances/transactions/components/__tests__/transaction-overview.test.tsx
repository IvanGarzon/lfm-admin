// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransactionOverview } from '../transaction-overview';
import { createTransactionStatistics } from '@/lib/testing/factories/transaction.factory';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/features/finances/invoices/components/analytics/stat-card', () => ({
  StatCard: ({
    title,
    value,
    isLoading
  }: {
    title: string;
    value: string | number;
    isLoading: boolean;
    description?: string;
    comparisonLabel?: string;
    growth?: number;
    icon?: unknown;
    color?: string;
  }) => (
    <div data-testid={`stat-card-${title.toLowerCase().replace(/ /g, '-')}`}>
      {isLoading ? <span>Loading...</span> : <span>{value}</span>}
    </div>
  )
}));

// -- Tests ------------------------------------------------------------------

describe('TransactionOverview', () => {
  it('renders all three stat cards', () => {
    render(
      <TransactionOverview stats={undefined} isLoading={false} comparisonLabel='vs. last month' />
    );
    expect(screen.getByTestId('stat-card-total-income')).toBeInTheDocument();
    expect(screen.getByTestId('stat-card-total-expenses')).toBeInTheDocument();
    expect(screen.getByTestId('stat-card-net-cash-flow')).toBeInTheDocument();
  });

  it('passes formatted income value from stats', () => {
    const stats = createTransactionStatistics({ totalIncome: 50000 });
    render(
      <TransactionOverview stats={stats} isLoading={false} comparisonLabel='vs. last month' />
    );
    expect(screen.getByTestId('stat-card-total-income')).not.toBeEmptyDOMElement();
  });

  it('shows loading state in all cards when isLoading is true', () => {
    render(
      <TransactionOverview stats={undefined} isLoading={true} comparisonLabel='vs. last month' />
    );
    expect(screen.getAllByText('Loading...')).toHaveLength(3);
  });

  it('renders correctly when stats is undefined (zero fallback)', () => {
    expect(() =>
      render(
        <TransactionOverview stats={undefined} isLoading={false} comparisonLabel='vs. last month' />
      )
    ).not.toThrow();
  });
});
