// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { InvoicePreviewItemsTable } from '../../preview/invoice-preview-items-table';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  return {
    ...actual,
    formatCurrency: ({ number }: { number: number }) => `$${number.toFixed(2)}`
  };
});

// -- Helpers ----------------------------------------------------------------

import { createInvoiceItemDetail } from '@/lib/testing/factories/invoice.factory';

// -- Tests ------------------------------------------------------------------

describe('InvoicePreviewItemsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Column headers -------------------------------------------------------

  describe('column headers', () => {
    it('renders Items column header', () => {
      render(<InvoicePreviewItemsTable items={[]} />);

      expect(screen.getAllByText('Items')[0]).toBeInTheDocument();
    });

    it('renders QTY column header', () => {
      render(<InvoicePreviewItemsTable items={[]} />);

      expect(screen.getByText('QTY')).toBeInTheDocument();
    });

    it('renders Cost column header', () => {
      render(<InvoicePreviewItemsTable items={[]} />);

      expect(screen.getByText('Cost')).toBeInTheDocument();
    });

    it('renders Total column header', () => {
      render(<InvoicePreviewItemsTable items={[]} />);

      expect(screen.getAllByText('Total')[0]).toBeInTheDocument();
    });
  });

  // -- Item rows ------------------------------------------------------------

  describe('item rows', () => {
    it('renders item description', () => {
      render(
        <InvoicePreviewItemsTable
          items={[createInvoiceItemDetail({ description: 'Dance class — beginner' })]}
        />
      );

      expect(screen.getByText('Dance class — beginner')).toBeInTheDocument();
    });

    it('renders item quantity', () => {
      render(<InvoicePreviewItemsTable items={[createInvoiceItemDetail({ quantity: 3 })]} />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('renders formatted unit price', () => {
      render(<InvoicePreviewItemsTable items={[createInvoiceItemDetail({ unitPrice: 75 })]} />);

      expect(screen.getByText('$75.00')).toBeInTheDocument();
    });

    it('renders formatted total', () => {
      render(<InvoicePreviewItemsTable items={[createInvoiceItemDetail({ total: 150 })]} />);

      expect(screen.getByText('$150.00')).toBeInTheDocument();
    });

    it('renders multiple items', () => {
      const items = [
        createInvoiceItemDetail({ id: 'item-1', description: 'Ballet — intermediate' }),
        createInvoiceItemDetail({ id: 'item-2', description: 'Jazz — advanced' })
      ];

      render(<InvoicePreviewItemsTable items={items} />);

      expect(screen.getByText('Ballet — intermediate')).toBeInTheDocument();
      expect(screen.getByText('Jazz — advanced')).toBeInTheDocument();
    });

    it('renders empty table with no rows when items is empty', () => {
      render(<InvoicePreviewItemsTable items={[]} />);

      const rows = screen.queryAllByRole('row');
      // Only the header row
      expect(rows).toHaveLength(1);
    });
  });

  // -- Loading state --------------------------------------------------------

  describe('loading state', () => {
    it('renders skeleton rows when isLoadingItems is true', () => {
      render(<InvoicePreviewItemsTable items={[]} isLoadingItems />);

      const rows = screen.getAllByRole('row');
      // 1 header + 3 skeleton rows
      expect(rows).toHaveLength(4);
    });

    it('does not render item descriptions when loading', () => {
      render(
        <InvoicePreviewItemsTable
          items={[createInvoiceItemDetail({ description: 'Should not appear' })]}
          isLoadingItems
        />
      );

      expect(screen.queryByText('Should not appear')).not.toBeInTheDocument();
    });

    it('renders items when isLoadingItems is false', () => {
      render(
        <InvoicePreviewItemsTable
          items={[createInvoiceItemDetail({ description: 'Dance class — beginner' })]}
          isLoadingItems={false}
        />
      );

      expect(screen.getByText('Dance class — beginner')).toBeInTheDocument();
    });
  });
});
