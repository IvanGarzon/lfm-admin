// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionAnalytics } from '../analytics/transaction-analytics';
import {
  createTransactionStatistics,
  createTopCategory
} from '@/lib/testing/factories/transaction.factory';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/features/finances/transactions/hooks/use-transaction-queries', () => ({
  useTransactionTrend: () => ({ data: undefined, isLoading: false }),
  useTopCategories: () => ({ data: [], isLoading: false })
}));

vi.mock('@/features/finances/invoices/components/analytics/stat-card', () => ({
  StatCard: ({
    title,
    value,
    isLoading
  }: {
    title: string;
    value: string | number;
    isLoading: boolean;
  }) => (
    <div data-testid={`stat-card-${title.toLowerCase().replace(/ /g, '-')}`}>
      {isLoading ? <span>Loading...</span> : <span>{value}</span>}
    </div>
  )
}));

vi.mock('../analytics/top-categories-table', () => ({
  TopCategoriesTable: ({ isLoading }: { isLoading: boolean }) => (
    <div data-testid='top-categories-table'>{isLoading ? 'Loading...' : 'Categories'}</div>
  )
}));

vi.mock('@/components/date-range-picker', () => ({
  CalendarDateRangePicker: ({
    onDateChange
  }: {
    date?: unknown;
    onDateChange: (range: unknown) => void;
  }) => (
    <button onClick={() => onDateChange({ from: new Date(), to: new Date() })}>
      Change date range
    </button>
  )
}));

// CashFlowChart is loaded dynamically - mock the dynamic import
vi.mock('../analytics/cash-flow-chart', () => ({
  default: () => <div data-testid='cash-flow-chart' />
}));

// -- Tests ------------------------------------------------------------------

describe('TransactionAnalytics', () => {
  const defaultProps = {
    isLoading: false,
    onDateRangeChange: vi.fn(),
    comparisonLabel: 'vs. last month'
  };

  // -- Heading --------------------------------------------------------------

  it('renders the Detailed Analytics heading', () => {
    render(<TransactionAnalytics {...defaultProps} />);
    expect(screen.getByText('Detailed Analytics')).toBeInTheDocument();
  });

  // -- Stat cards -----------------------------------------------------------

  it('renders the Pending stat card', () => {
    render(<TransactionAnalytics {...defaultProps} />);
    expect(screen.getByTestId('stat-card-pending')).toBeInTheDocument();
  });

  it('renders the Avg Transaction stat card', () => {
    render(<TransactionAnalytics {...defaultProps} />);
    expect(screen.getByTestId('stat-card-avg-transaction')).toBeInTheDocument();
  });

  it('passes stats values to stat cards', () => {
    const stats = createTransactionStatistics({ pendingTransactions: 7 });
    render(<TransactionAnalytics {...defaultProps} stats={stats} />);
    expect(screen.getByTestId('stat-card-pending')).toHaveTextContent('7');
  });

  it('shows loading state in stat cards when isLoading', () => {
    render(<TransactionAnalytics {...defaultProps} isLoading={true} />);
    expect(screen.getAllByText('Loading...')).toHaveLength(2);
  });

  // -- Export button --------------------------------------------------------

  it('renders Export button', () => {
    render(<TransactionAnalytics {...defaultProps} />);
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
  });

  // -- Date range -----------------------------------------------------------

  it('calls onDateRangeChange when date range changes', () => {
    const onDateRangeChange = vi.fn();
    render(<TransactionAnalytics {...defaultProps} onDateRangeChange={onDateRangeChange} />);
    fireEvent.click(screen.getByText('Change date range'));
    expect(onDateRangeChange).toHaveBeenCalledOnce();
  });

  // -- Top categories -------------------------------------------------------

  it('renders the TopCategoriesTable', () => {
    render(<TransactionAnalytics {...defaultProps} />);
    expect(screen.getByTestId('top-categories-table')).toBeInTheDocument();
  });
});
