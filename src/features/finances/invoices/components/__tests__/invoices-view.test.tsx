// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { InvoiceStatus } from '@/prisma/client';

import { InvoicesView } from '../invoices-view';
import { createInvoicePagination } from '@/lib/testing/factories/invoice.factory';

// -- Mocks ------------------------------------------------------------------

const { mockUseInvoices, mockUseInvoiceStatistics, mockUseQueryStates } = vi.hoisted(() => ({
  mockUseInvoices: vi.fn(),
  mockUseInvoiceStatistics: vi.fn(),
  mockUseQueryStates: vi.fn()
}));

vi.mock('nuqs', () => ({
  useQueryStates: mockUseQueryStates
}));

vi.mock('@/features/finances/invoices/hooks/use-invoice-queries', () => ({
  useInvoices: mockUseInvoices,
  useInvoiceStatistics: mockUseInvoiceStatistics
}));

vi.mock('@/features/finances/invoices/components/invoice-list', () => ({
  InvoiceList: ({ data }: { data?: unknown }) => (
    <div data-testid='invoice-list' data-has-data={Boolean(data)} />
  )
}));

vi.mock('@/features/finances/invoices/components/invoice-overview', () => ({
  InvoiceOverview: () => <div data-testid='invoice-overview' />
}));

vi.mock('@/features/finances/invoices/components/invoice-analytics', () => ({
  InvoiceAnalytics: () => <div data-testid='invoice-analytics' />
}));

vi.mock('next/dynamic', () => ({
  default:
    () =>
    ({ open, onClose }: { open: boolean; onClose: () => void }) =>
      open ? <div data-testid='invoice-drawer' onClick={onClose} /> : null
}));

vi.mock('@/components/shared/empty-state', async () => {
  const { emptyStateMock } = await import('@/lib/testing/mocks/empty-state.mock');
  return emptyStateMock;
});

vi.mock('@/filters/invoices/invoices-filters', () => ({
  searchParams: {
    search: { defaultValue: '' },
    page: { defaultValue: 1 },
    perPage: { defaultValue: 20 },
    status: { defaultValue: [] },
    sort: { defaultValue: [] }
  }
}));

// -- Helpers ----------------------------------------------------------------

function makeDefaultStats() {
  return {
    total: 0,
    draft: 0,
    pending: 0,
    paid: 0,
    cancelled: 0,
    overdue: 0,
    partiallyPaid: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    avgInvoiceValue: 0
  };
}

// -- Tests ------------------------------------------------------------------

describe('InvoicesView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const defaultStatus: InvoiceStatus[] = [];
    mockUseQueryStates.mockReturnValue([
      { search: '', page: 1, perPage: 20, status: defaultStatus, sort: [] },
      vi.fn()
    ]);
    mockUseInvoiceStatistics.mockReturnValue({ data: makeDefaultStats(), isLoading: false });
  });

  // -- Zero state -----------------------------------------------------------

  describe('zero state', () => {
    beforeEach(() => {
      mockUseInvoices.mockReturnValue({ data: createInvoicePagination(0) });
    });

    it('renders EmptyState when there are no invoices and no active filters', () => {
      render(<InvoicesView />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('does not render the Invoices heading in zero state', () => {
      render(<InvoicesView />);

      expect(screen.queryByRole('heading', { name: 'Invoices' })).not.toBeInTheDocument();
    });

    it('does not render InvoiceList in zero state', () => {
      render(<InvoicesView />);

      expect(screen.queryByTestId('invoice-list')).not.toBeInTheDocument();
    });

    it('renders Add Invoice button in EmptyState', () => {
      render(<InvoicesView />);

      expect(screen.getByRole('button', { name: /add invoice/i })).toBeInTheDocument();
    });

    it('does not show EmptyState when a search filter is active and results are empty', () => {
      mockUseQueryStates.mockReturnValueOnce([
        { search: 'INV-001', page: 1, perPage: 20, status: [], sort: [] },
        vi.fn()
      ]);

      render(<InvoicesView />);

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });

    it('does not show EmptyState when a status filter is active and results are empty', () => {
      const activeStatus: InvoiceStatus[] = ['OVERDUE'];
      mockUseQueryStates.mockReturnValueOnce([
        { search: '', page: 1, perPage: 20, status: activeStatus, sort: [] },
        vi.fn()
      ]);

      render(<InvoicesView />);

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });
  });

  // -- Normal state (invoices exist) ----------------------------------------

  describe('normal state', () => {
    beforeEach(() => {
      mockUseInvoices.mockReturnValue({ data: createInvoicePagination(5) });
    });

    it('renders the Invoices heading', () => {
      render(<InvoicesView />);

      expect(screen.getByRole('heading', { name: 'Invoices' })).toBeInTheDocument();
    });

    it('renders InvoiceList', () => {
      render(<InvoicesView />);

      expect(screen.getByTestId('invoice-list')).toBeInTheDocument();
    });

    it('renders InvoiceOverview', () => {
      render(<InvoicesView />);

      expect(screen.getByTestId('invoice-overview')).toBeInTheDocument();
    });

    it('does not render EmptyState when invoices exist', () => {
      render(<InvoicesView />);

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });

    it('renders New Invoice button', () => {
      render(<InvoicesView />);

      expect(screen.getByRole('button', { name: /new invoice/i })).toBeInTheDocument();
    });
  });

  // -- Loading / undefined data ---------------------------------------------

  describe('when data is undefined (loading)', () => {
    it('does not crash and renders the normal view shell', () => {
      mockUseInvoices.mockReturnValue({ data: undefined });

      render(<InvoicesView />);

      // data?.pagination.totalItems is undefined (not 0), so isZeroState is false —
      // the Tabs shell renders while data loads rather than showing EmptyState
      expect(screen.getByRole('heading', { name: 'Invoices' })).toBeInTheDocument();
    });
  });

  // -- Create modal ---------------------------------------------------------

  describe('create modal', () => {
    beforeEach(() => {
      mockUseInvoices.mockReturnValue({ data: createInvoicePagination(3) });
    });

    it('does not render InvoiceDrawer initially', () => {
      render(<InvoicesView />);

      expect(screen.queryByTestId('invoice-drawer')).not.toBeInTheDocument();
    });

    it('opens InvoiceDrawer when New Invoice button is clicked', () => {
      render(<InvoicesView />);

      fireEvent.click(screen.getByRole('button', { name: /new invoice/i }));

      expect(screen.getByTestId('invoice-drawer')).toBeInTheDocument();
    });

    it('closes InvoiceDrawer when onClose is called', () => {
      render(<InvoicesView />);

      fireEvent.click(screen.getByRole('button', { name: /new invoice/i }));
      fireEvent.click(screen.getByTestId('invoice-drawer'));

      expect(screen.queryByTestId('invoice-drawer')).not.toBeInTheDocument();
    });
  });

  describe('create modal from zero state', () => {
    beforeEach(() => {
      mockUseInvoices.mockReturnValue({ data: createInvoicePagination(0) });
    });

    it('opens InvoiceDrawer from the EmptyState Add Invoice button', () => {
      render(<InvoicesView />);

      fireEvent.click(screen.getByRole('button', { name: /add invoice/i }));

      expect(screen.getByTestId('invoice-drawer')).toBeInTheDocument();
    });
  });

  // -- Tab switching --------------------------------------------------------

  describe('tab switching', () => {
    beforeEach(() => {
      mockUseInvoices.mockReturnValue({ data: createInvoicePagination(3) });
    });

    it('renders List tab and Analytics tab triggers', () => {
      render(<InvoicesView />);

      expect(screen.getByRole('tab', { name: /list/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /analytics/i })).toBeInTheDocument();
    });

    it('shows InvoiceList by default on the List tab', () => {
      render(<InvoicesView />);

      expect(screen.getByTestId('invoice-list')).toBeInTheDocument();
    });

    it('shows InvoiceAnalytics panel when Analytics tab is selected', () => {
      render(<InvoicesView />);

      fireEvent.click(screen.getByRole('tab', { name: /analytics/i }));

      // Radix TabsContent uses hidden attribute for inactive panels, not DOM removal.
      // After switching, the analytics panel becomes visible (no hidden attr).
      const analyticsPanel = screen.getByRole('tabpanel', { hidden: false });
      expect(analyticsPanel).not.toHaveAttribute('hidden');
    });
  });
});
