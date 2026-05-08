// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionDrawer } from '../transaction-drawer';
import { createTransactionWithDetails } from '@/lib/testing/factories/transaction.factory';

// -- Mocks ------------------------------------------------------------------

const { mockRouterPush, mockPathname } = vi.hoisted(() => ({
  mockRouterPush: vi.fn(),
  mockPathname: { current: '/finances/transactions' }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  usePathname: () => mockPathname.current
}));

vi.mock('@/hooks/use-query-string', () => ({
  useQueryString: () => ''
}));

const { mockUseTransaction, mockCreateMutate, mockUpdateMutate } = vi.hoisted(() => ({
  mockUseTransaction: vi.fn(),
  mockCreateMutate: vi.fn(),
  mockUpdateMutate: vi.fn()
}));

vi.mock('@/features/finances/transactions/hooks/use-transaction-queries', () => ({
  useTransaction: (...args: unknown[]) => mockUseTransaction(...args),
  useCreateTransaction: () => ({ mutate: mockCreateMutate, isPending: false }),
  useUpdateTransaction: () => ({ mutate: mockUpdateMutate, isPending: false })
}));

vi.mock('../transaction-form', () => ({
  TransactionForm: () => <div data-testid='transaction-form' />
}));

vi.mock('../transaction-drawer-skeleton', () => ({
  TransactionDrawerSkeleton: () => <div data-testid='transaction-drawer-skeleton' />
}));

vi.mock('@/components/shared/unsaved-changes-dialog', () => ({
  UnsavedChangesDialog: () => null
}));

// -- Tests ------------------------------------------------------------------

describe('TransactionDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.current = '/finances/transactions';
    mockUseTransaction.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      isError: false
    });
  });

  // -- Create mode ----------------------------------------------------------

  describe('create mode (no id)', () => {
    it('shows "New Transaction" title when open', () => {
      render(<TransactionDrawer open={true} />);
      expect(screen.getByText('New Transaction')).toBeInTheDocument();
    });

    it('shows create description', () => {
      render(<TransactionDrawer open={true} />);
      expect(screen.getByText('Create a new income or expense transaction.')).toBeInTheDocument();
    });

    it('renders the transaction form', () => {
      render(<TransactionDrawer open={true} />);
      expect(screen.getByTestId('transaction-form')).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      render(<TransactionDrawer open={false} />);
      expect(screen.queryByText('New Transaction')).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<TransactionDrawer open={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  // -- Edit mode ------------------------------------------------------------

  describe('edit mode (with id)', () => {
    beforeEach(() => {
      mockPathname.current = '/finances/transactions/txn-1';
    });

    it('shows "Edit Transaction" title', () => {
      const transaction = createTransactionWithDetails({ id: 'txn-1' });
      mockUseTransaction.mockReturnValue({
        data: transaction,
        isLoading: false,
        error: null,
        isError: false
      });
      render(<TransactionDrawer id='txn-1' open={true} />);
      expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
    });

    it('shows edit description', () => {
      mockUseTransaction.mockReturnValue({
        data: createTransactionWithDetails(),
        isLoading: false,
        error: null,
        isError: false
      });
      render(<TransactionDrawer id='txn-1' open={true} />);
      expect(screen.getByText('Update the transaction details below.')).toBeInTheDocument();
    });

    it('shows skeleton while loading', () => {
      mockUseTransaction.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        isError: false
      });
      render(<TransactionDrawer id='txn-1' open={true} />);
      expect(screen.getByTestId('transaction-drawer-skeleton')).toBeInTheDocument();
    });
  });

  // -- Error state ----------------------------------------------------------

  it('shows error message when transaction fails to load', () => {
    mockPathname.current = '/finances/transactions/txn-bad';
    mockUseTransaction.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'Not found' },
      isError: true
    });
    render(<TransactionDrawer id='txn-bad' open={true} />);
    expect(screen.getByText(/could not load transaction details/i)).toBeInTheDocument();
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });
});
