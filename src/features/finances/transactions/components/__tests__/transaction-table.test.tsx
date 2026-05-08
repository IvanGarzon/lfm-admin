// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransactionTable } from '../transaction-table';
import { createTransactionWithDetails } from '@/lib/testing/factories/transaction.factory';
import type { Table } from '@tanstack/react-table';
import type { TransactionListItem } from '@/features/finances/transactions/types';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/features/finances/transactions/hooks/use-transaction-queries', () => ({
  usePrefetchTransaction: () => vi.fn()
}));

vi.mock('@/components/shared/tableV3/data-table', () => ({
  DataTable: () => <div data-testid='data-table' />
}));

vi.mock('@/components/shared/tableV3/data-table-toolbar', () => ({
  DataTableToolbar: () => <div data-testid='data-table-toolbar' />
}));

// -- Helpers ----------------------------------------------------------------

function makeTable(): Table<TransactionListItem> {
  return {} as Table<TransactionListItem>;
}

// -- Tests ------------------------------------------------------------------

describe('TransactionTable', () => {
  it('shows "No transactions found" when items is empty', () => {
    render(<TransactionTable table={makeTable()} items={[]} totalItems={0} />);
    expect(screen.getByText(/no transactions found/i)).toBeInTheDocument();
  });

  it('renders the toolbar regardless of items', () => {
    render(<TransactionTable table={makeTable()} items={[]} totalItems={0} />);
    expect(screen.getByTestId('data-table-toolbar')).toBeInTheDocument();
  });

  it('renders DataTable when items exist', () => {
    const items = [createTransactionWithDetails(), createTransactionWithDetails()];
    render(<TransactionTable table={makeTable()} items={items} totalItems={2} />);
    expect(screen.getByTestId('data-table')).toBeInTheDocument();
  });

  it('does not show the empty message when items exist', () => {
    const items = [createTransactionWithDetails()];
    render(<TransactionTable table={makeTable()} items={items} totalItems={1} />);
    expect(screen.queryByText(/no transactions found/i)).not.toBeInTheDocument();
  });
});
