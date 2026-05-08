// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TransactionList } from '../transaction-list';
import { createTransactionWithDetails } from '@/lib/testing/factories/transaction.factory';

// -- Mocks ------------------------------------------------------------------

const mockMutate = vi.fn();
const mockDeleteTransaction = { mutate: mockMutate, isPending: false };

vi.mock('@/features/finances/transactions/hooks/use-transaction-queries', () => ({
  useDeleteTransaction: () => mockDeleteTransaction
}));

vi.mock('@/features/finances/transactions/components/transaction-columns', () => ({
  createTransactionColumns: vi.fn(() => [])
}));

vi.mock('@/features/finances/transactions/components/transaction-table', () => ({
  TransactionTable: () => <div data-testid='transaction-table' />
}));

vi.mock('@/features/finances/transactions/components/dialogs/delete-transaction-dialog', () => ({
  DeleteTransactionDialog: ({
    open,
    onConfirm,
    onOpenChange
  }: {
    open: boolean;
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
    referenceNumber?: string;
    isPending?: boolean;
  }) =>
    open ? (
      <div data-testid='delete-transaction-dialog'>
        <button onClick={onConfirm}>Confirm delete</button>
        <button onClick={() => onOpenChange(false)}>Cancel</button>
      </div>
    ) : null
}));

vi.mock('@/hooks/use-data-table', async () => {
  const { useDataTableMock } = await import('@/lib/testing/mocks/use-data-table.mock');
  return useDataTableMock;
});

// -- Helpers ----------------------------------------------------------------

function makeData(totalItems: number) {
  return {
    items: Array.from({ length: totalItems }, (_, i) =>
      createTransactionWithDetails({ id: `transaction-${i}`, referenceNumber: `TXN-${i}` })
    ),
    pagination: { totalItems, page: 1, perPage: 20, totalPages: Math.ceil(totalItems / 20) }
  };
}

// -- Tests ------------------------------------------------------------------

describe('TransactionList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Rendering ------------------------------------------------------------

  describe('rendering', () => {
    it('renders TransactionTable', () => {
      render(<TransactionList data={makeData(3)} />);
      expect(screen.getByTestId('transaction-table')).toBeInTheDocument();
    });

    it('renders without crashing when data is undefined', () => {
      expect(() => render(<TransactionList />)).not.toThrow();
    });

    it('renders TransactionTable even when data is undefined', () => {
      render(<TransactionList />);
      expect(screen.getByTestId('transaction-table')).toBeInTheDocument();
    });

    it('does not show delete dialog initially', () => {
      render(<TransactionList data={makeData(3)} />);
      expect(screen.queryByTestId('delete-transaction-dialog')).not.toBeInTheDocument();
    });
  });

  // -- Delete confirmation --------------------------------------------------

  describe('delete confirmation', () => {
    let capturedDeleteFn: ((id: string, referenceNumber?: string) => void) | undefined;

    beforeEach(async () => {
      const { createTransactionColumns } = vi.mocked(
        await import('@/features/finances/transactions/components/transaction-columns')
      );
      (createTransactionColumns as ReturnType<typeof vi.fn>).mockImplementation(
        (onDelete: (id: string, referenceNumber?: string) => void) => {
          capturedDeleteFn = onDelete;
          return [];
        }
      );
    });

    it('opens delete dialog when onDelete is called from columns', () => {
      render(<TransactionList data={makeData(3)} />);
      act(() => capturedDeleteFn?.('transaction-0', 'TXN-0'));
      expect(screen.getByTestId('delete-transaction-dialog')).toBeInTheDocument();
    });

    it('calls deleteTransaction.mutate with the pending id when confirm is clicked', () => {
      render(<TransactionList data={makeData(3)} />);
      act(() => capturedDeleteFn?.('transaction-0', 'TXN-0'));
      fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }));
      expect(mockMutate).toHaveBeenCalledWith(
        'transaction-0',
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
    });

    it('does not call deleteTransaction.mutate when dialog is cancelled', () => {
      render(<TransactionList data={makeData(3)} />);
      act(() => capturedDeleteFn?.('transaction-0', 'TXN-0'));
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('closes delete dialog when cancelled', () => {
      render(<TransactionList data={makeData(3)} />);
      act(() => capturedDeleteFn?.('transaction-0', 'TXN-0'));
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(screen.queryByTestId('delete-transaction-dialog')).not.toBeInTheDocument();
    });

    it('does not open delete dialog when data is undefined', () => {
      render(<TransactionList />);
      act(() => capturedDeleteFn?.('transaction-0', 'TXN-0'));
      expect(screen.getByTestId('delete-transaction-dialog')).toBeInTheDocument();
    });
  });
});
