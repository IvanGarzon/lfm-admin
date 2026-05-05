// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InvoiceList } from '../invoice-list';
import { createInvoicePagination } from '@/lib/testing/factories/invoice.factory';

// -- Mocks ------------------------------------------------------------------

// InvoiceList calls multiple mutation hooks from the same module — mock the
// entire module so none attempt real network calls or context access.
vi.mock('@/features/finances/invoices/hooks/use-invoice-queries', () => ({
  useSendInvoiceReminder: () => ({ mutate: vi.fn(), isPending: false }),
  useDownloadInvoicePdf: () => ({ mutate: vi.fn(), isPending: false }),
  useBulkUpdateInvoiceStatus: () => ({ mutate: vi.fn(), isPending: false }),
  useDuplicateInvoice: () => ({ mutate: vi.fn(), isPending: false }),
  useMarkInvoiceAsDraft: () => ({ mutate: vi.fn(), isPending: false })
}));

vi.mock('@/features/finances/invoices/context/invoice-action-context', () => ({
  useInvoiceActions: () => ({
    openDelete: vi.fn(),
    openRecordPayment: vi.fn(),
    openCancel: vi.fn(),
    openSendReceipt: vi.fn(),
    openMarkAsPending: vi.fn()
  })
}));

vi.mock('@/features/finances/invoices/components/invoice-columns', () => ({
  createInvoiceColumns: vi.fn(() => [])
}));

vi.mock('@/features/finances/invoices/components/invoice-table', () => ({
  InvoiceTable: ({ totalItems }: { table: unknown; items: unknown[]; totalItems: number }) => (
    <div data-testid='invoice-table' data-total={totalItems} />
  )
}));

vi.mock('@/features/finances/invoices/components/bulk-actions-bar', () => ({
  BulkActionsBar: () => <div data-testid='bulk-actions-bar' />
}));

vi.mock('@/components/email/email-preview-dialog', () => ({
  EmailPreviewDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid='email-preview-dialog' /> : null
}));

vi.mock('@/actions/finances/invoices/preview-email', () => ({
  previewInvoiceEmail: vi.fn()
}));

vi.mock('@/hooks/use-data-table', async () => {
  const { useDataTableMock } = await import('@/lib/testing/mocks/use-data-table.mock');
  return useDataTableMock;
});

// -- Tests ------------------------------------------------------------------

describe('InvoiceList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Rendering ------------------------------------------------------------

  describe('rendering', () => {
    it('renders InvoiceTable when data is provided', () => {
      render(<InvoiceList data={createInvoicePagination(5)} />);

      expect(screen.getByTestId('invoice-table')).toBeInTheDocument();
    });

    it('renders InvoiceTable with correct totalItems', () => {
      render(<InvoiceList data={createInvoicePagination(12)} />);

      expect(screen.getByTestId('invoice-table')).toHaveAttribute('data-total', '12');
    });

    it('renders InvoiceTable with zero totalItems when data is undefined', () => {
      render(<InvoiceList data={undefined} />);

      expect(screen.getByTestId('invoice-table')).toHaveAttribute('data-total', '0');
    });

    it('renders BulkActionsBar', () => {
      render(<InvoiceList data={createInvoicePagination(3)} />);

      expect(screen.getByTestId('bulk-actions-bar')).toBeInTheDocument();
    });

    it('does not render EmailPreviewDialog by default', () => {
      render(<InvoiceList data={createInvoicePagination(3)} />);

      expect(screen.queryByTestId('email-preview-dialog')).not.toBeInTheDocument();
    });
  });
});
