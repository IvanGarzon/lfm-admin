// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionsView } from '../transactions-view';

// -- Mocks ------------------------------------------------------------------

const mockMutate = vi.fn();
const mockUseTransactions = vi.fn();
const mockUseTransactionStatistics = vi.fn(() => ({ data: undefined, isLoading: false }));

const { mockUseQueryStates } = vi.hoisted(() => ({
  mockUseQueryStates: vi.fn(() => [
    { search: '', page: 1, perPage: 20, type: [], status: [], sort: [] },
    vi.fn()
  ])
}));

vi.mock('nuqs', () => ({
  useQueryStates: mockUseQueryStates
}));

vi.mock('@/features/finances/transactions/hooks/use-transaction-queries', () => ({
  useTransactions: (...args: unknown[]) => mockUseTransactions(...args),
  useTransactionStatistics: (...args: unknown[]) => mockUseTransactionStatistics(...args)
}));

vi.mock('@/features/finances/transactions/components/transaction-list', () => ({
  TransactionList: () => <div data-testid='transaction-list' />
}));

vi.mock('@/features/finances/transactions/components/transaction-overview', () => ({
  TransactionOverview: () => <div data-testid='transaction-overview' />
}));

vi.mock('@/features/finances/transactions/components/analytics/transaction-analytics', () => ({
  TransactionAnalytics: () => <div data-testid='transaction-analytics' />
}));

vi.mock('@/components/shared/empty-state', async () => {
  const { emptyStateMock } = await import('@/lib/testing/mocks/empty-state.mock');
  return emptyStateMock;
});

vi.mock('next/dynamic', () => ({
  default:
    () =>
    ({ open }: { open: boolean; onClose: () => void }) =>
      open ? <div data-testid='transaction-drawer' /> : null
}));

// -- Helpers ----------------------------------------------------------------

import { createTransactionWithDetails } from '@/lib/testing/factories/transaction.factory';

function makeData(totalItems: number) {
  return {
    items: Array.from({ length: totalItems }, (_, i) =>
      createTransactionWithDetails({ id: `transaction-${i}` })
    ),
    pagination: { totalItems, page: 1, perPage: 20, totalPages: Math.ceil(totalItems / 20) }
  };
}

// -- Tests ------------------------------------------------------------------

describe('TransactionsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTransactionStatistics.mockReturnValue({ data: undefined, isLoading: false });
    mockUseQueryStates.mockReturnValue([
      { search: '', page: 1, perPage: 20, type: [], status: [], sort: [] },
      vi.fn()
    ]);
  });

  // -- Zero state -----------------------------------------------------------

  describe('zero state', () => {
    beforeEach(() => {
      mockUseTransactions.mockReturnValue({ data: makeData(0) });
    });

    it('renders EmptyState when there are no transactions and no active filters', () => {
      render(<TransactionsView />);
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('does not render the Transactions heading in zero state', () => {
      render(<TransactionsView />);
      expect(screen.queryByRole('heading', { name: 'Transactions' })).not.toBeInTheDocument();
    });

    it('does not render TransactionList in zero state', () => {
      render(<TransactionsView />);
      expect(screen.queryByTestId('transaction-list')).not.toBeInTheDocument();
    });

    it('renders a New Transaction action button in the EmptyState', () => {
      render(<TransactionsView />);
      expect(screen.getByRole('button', { name: /new transaction/i })).toBeInTheDocument();
    });

    it('does not show EmptyState when a search filter is active with zero results', () => {
      mockUseQueryStates.mockReturnValueOnce([
        { search: 'coffee', page: 1, perPage: 20, type: [], status: [], sort: [] },
        vi.fn()
      ]);
      render(<TransactionsView />);
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });

    it('does not show EmptyState when a status filter is active with zero results', () => {
      mockUseQueryStates.mockReturnValueOnce([
        { search: '', page: 1, perPage: 20, type: [], status: ['COMPLETED'], sort: [] },
        vi.fn()
      ]);
      render(<TransactionsView />);
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });
  });

  // -- Undefined data (initial load) ----------------------------------------

  describe('when data is undefined', () => {
    it('renders EmptyState when data is undefined and no active filters', () => {
      mockUseTransactions.mockReturnValue({ data: undefined });
      render(<TransactionsView />);
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('does not crash when data is undefined', () => {
      mockUseTransactions.mockReturnValue({ data: undefined });
      expect(() => render(<TransactionsView />)).not.toThrow();
    });
  });

  // -- Normal state ---------------------------------------------------------

  describe('normal state', () => {
    beforeEach(() => {
      mockUseTransactions.mockReturnValue({ data: makeData(5) });
    });

    it('renders the Transactions heading', () => {
      render(<TransactionsView />);
      expect(screen.getByRole('heading', { name: 'Transactions' })).toBeInTheDocument();
    });

    it('renders TransactionList', () => {
      render(<TransactionsView />);
      expect(screen.getByTestId('transaction-list')).toBeInTheDocument();
    });

    it('renders TransactionOverview', () => {
      render(<TransactionsView />);
      expect(screen.getByTestId('transaction-overview')).toBeInTheDocument();
    });

    it('does not render EmptyState when transactions exist', () => {
      render(<TransactionsView />);
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });

    it('renders a New Transaction button', () => {
      render(<TransactionsView />);
      expect(screen.getByRole('button', { name: /new transaction/i })).toBeInTheDocument();
    });
  });

  // -- Create modal ---------------------------------------------------------

  describe('create modal', () => {
    beforeEach(() => {
      mockUseTransactions.mockReturnValue({ data: makeData(3) });
    });

    it('does not render TransactionDrawer initially', () => {
      render(<TransactionsView />);
      expect(screen.queryByTestId('transaction-drawer')).not.toBeInTheDocument();
    });

    it('opens TransactionDrawer when New Transaction button is clicked', () => {
      render(<TransactionsView />);
      fireEvent.click(screen.getByRole('button', { name: /new transaction/i }));
      expect(screen.getByTestId('transaction-drawer')).toBeInTheDocument();
    });
  });

  describe('create modal from zero state', () => {
    beforeEach(() => {
      mockUseTransactions.mockReturnValue({ data: makeData(0) });
    });

    it('opens TransactionDrawer from the EmptyState New Transaction button', () => {
      render(<TransactionsView />);
      fireEvent.click(screen.getByRole('button', { name: /new transaction/i }));
      expect(screen.getByTestId('transaction-drawer')).toBeInTheDocument();
    });
  });

  // -- useTransactions called with current params ----------------------------

  describe('hook integration', () => {
    it('calls useTransactions with the current filter params', () => {
      const filters = { search: 'rent', page: 1, perPage: 20, type: [], status: [], sort: [] };
      mockUseQueryStates.mockReturnValue([filters, vi.fn()]);
      mockUseTransactions.mockReturnValue({ data: makeData(1) });

      render(<TransactionsView />);

      expect(mockUseTransactions).toHaveBeenCalledWith(filters);
    });
  });
});
