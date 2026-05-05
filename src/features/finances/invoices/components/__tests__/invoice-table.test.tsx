// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { InvoiceTable } from '../invoice-table';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/features/finances/invoices/hooks/use-invoice-queries', () => ({
  usePrefetchInvoice: () => vi.fn()
}));

vi.mock('@/components/shared/tableV3/data-table', () => ({
  DataTable: ({ totalItems }: { table: unknown; totalItems: number; onRowHover: unknown }) => (
    <div data-testid='data-table' data-total={totalItems} />
  )
}));

vi.mock('@/components/shared/tableV3/data-table-toolbar', () => ({
  DataTableToolbar: () => <div data-testid='data-table-toolbar' />
}));

// -- Helpers ----------------------------------------------------------------

function makeTable() {
  return {} as Parameters<typeof InvoiceTable>[0]['table'];
}

// -- Tests ------------------------------------------------------------------

describe('InvoiceTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Rendering with data --------------------------------------------------

  describe('with items', () => {
    it('renders the toolbar', () => {
      render(<InvoiceTable table={makeTable()} items={[{ id: 'inv-1' }]} totalItems={1} />);

      expect(screen.getByTestId('data-table-toolbar')).toBeInTheDocument();
    });

    it('renders DataTable when items are present', () => {
      render(<InvoiceTable table={makeTable()} items={[{ id: 'inv-1' }]} totalItems={1} />);

      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });

    it('passes totalItems to DataTable', () => {
      render(
        <InvoiceTable table={makeTable()} items={[{ id: 'a' }, { id: 'b' }]} totalItems={2} />
      );

      expect(screen.getByTestId('data-table')).toHaveAttribute('data-total', '2');
    });

    it('does not render the empty state when items are present', () => {
      render(<InvoiceTable table={makeTable()} items={[{ id: 'inv-1' }]} totalItems={1} />);

      expect(screen.queryByText(/no invoices found/i)).not.toBeInTheDocument();
    });
  });

  // -- Empty state ----------------------------------------------------------

  describe('with no items', () => {
    it('renders the empty state message', () => {
      render(<InvoiceTable table={makeTable()} items={[]} totalItems={0} />);

      expect(
        screen.getByText('No invoices found. Try adjusting your filters.')
      ).toBeInTheDocument();
    });

    it('does not render DataTable when items are empty', () => {
      render(<InvoiceTable table={makeTable()} items={[]} totalItems={0} />);

      expect(screen.queryByTestId('data-table')).not.toBeInTheDocument();
    });

    it('still renders the toolbar when items are empty', () => {
      render(<InvoiceTable table={makeTable()} items={[]} totalItems={0} />);

      expect(screen.getByTestId('data-table-toolbar')).toBeInTheDocument();
    });
  });
});
