// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { InvoiceDrawer } from '../invoice-drawer';
import { createInvoiceDetails } from '@/lib/testing/factories/invoice.factory';

// -- Mocks ------------------------------------------------------------------

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/finances/invoices'),
  useRouter: vi.fn(() => ({ push: vi.fn() }))
}));

vi.mock('@/hooks/use-query-string', () => ({
  useQueryString: vi.fn(() => '')
}));

vi.mock('@/hooks/use-unsaved-changes-warning', () => ({
  useUnsavedChangesWarning: vi.fn(() => vi.fn())
}));

vi.mock('@/filters/invoices/invoices-filters', () => ({
  searchParams: {},
  invoiceSearchParamsDefaults: {}
}));

vi.mock('@/actions/finances/invoices/preview-email', () => ({
  previewInvoiceEmail: vi.fn()
}));

vi.mock('@/features/finances/invoices/hooks/use-invoice-queries', () => ({
  useInvoiceMetadata: vi.fn(),
  useInvoiceItems: vi.fn(() => ({ data: undefined, isLoading: false })),
  useInvoiceHistory: vi.fn(() => ({ data: undefined, isLoading: false })),
  useInvoicePayments: vi.fn(() => ({ data: undefined, isLoading: false })),
  useCreateInvoice: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useUpdateInvoice: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useSendInvoiceReminder: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDownloadInvoicePdf: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDuplicateInvoice: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useMarkInvoiceAsDraft: vi.fn(() => ({ mutate: vi.fn(), isPending: false }))
}));

vi.mock('@/features/finances/invoices/context/invoice-action-context', () => ({
  useInvoiceActions: vi.fn(() => ({
    openDelete: vi.fn(),
    openRecordPayment: vi.fn(),
    openCancel: vi.fn(),
    openSendReceipt: vi.fn(),
    openMarkAsPending: vi.fn()
  }))
}));

vi.mock('@/features/finances/invoices/components/invoice-form', () => ({
  InvoiceForm: () => <div data-testid='invoice-form' />
}));

vi.mock('@/features/finances/invoices/components/invoice-drawer-skeleton', () => ({
  InvoiceDrawerSkeleton: () => <div data-testid='invoice-drawer-skeleton' />
}));

vi.mock('@/features/finances/invoices/components/invoice-drawer-header', () => ({
  InvoiceDrawerHeader: ({ title, mode }: { title: string; mode: string }) => (
    <div data-testid='invoice-drawer-header' data-mode={mode} data-title={title} />
  )
}));

vi.mock('@/features/finances/invoices/components/invoice-preview-panel', () => ({
  InvoicePreviewPanel: () => <div data-testid='invoice-preview-panel' />
}));

vi.mock('@/features/finances/invoices/components/invoice-payments', () => ({
  InvoicePayments: () => <div data-testid='invoice-payments' />
}));

vi.mock('@/features/finances/invoices/components/invoice-status-history', () => ({
  InvoiceStatusHistory: () => <div data-testid='invoice-status-history' />
}));

vi.mock('@/components/email/email-preview-dialog', () => ({
  EmailPreviewDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid='email-preview-dialog' /> : null
}));

vi.mock('@/components/shared/unsaved-changes-dialog', () => ({
  UnsavedChangesDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid='unsaved-changes-dialog' /> : null
}));

// -- Helpers ----------------------------------------------------------------

import { useInvoiceMetadata } from '@/features/finances/invoices/hooks/use-invoice-queries';
import { usePathname } from 'next/navigation';

const mockUseInvoiceMetadata = vi.mocked(useInvoiceMetadata);
const mockUsePathname = vi.mocked(usePathname);

function makeLoadingState() {
  return { data: undefined, isLoading: true, error: undefined, isError: false };
}

function makeLoadedState(invoice = createInvoiceDetails()) {
  return { data: invoice, isLoading: false, error: undefined, isError: false };
}

function makeErrorState(message = 'Server error') {
  return {
    data: undefined,
    isLoading: false,
    error: new Error(message),
    isError: true
  };
}

// -- Tests ------------------------------------------------------------------

describe('InvoiceDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/finances/invoices');
  });

  // -- Visibility -----------------------------------------------------------

  describe('visibility', () => {
    it('renders drawer content when open prop is true in create mode', () => {
      mockUseInvoiceMetadata.mockReturnValue(makeLoadedState());

      render(<InvoiceDrawer open={true} />);

      expect(screen.getByTestId('invoice-drawer-header')).toBeInTheDocument();
    });

    it('does not render drawer content when open prop is false in create mode', () => {
      mockUseInvoiceMetadata.mockReturnValue(makeLoadedState());

      render(<InvoiceDrawer open={false} />);

      expect(screen.queryByTestId('invoice-drawer-header')).not.toBeInTheDocument();
    });

    it('renders drawer content when pathname matches invoice id in edit mode', () => {
      const invoice = createInvoiceDetails({ id: 'inv-123' });
      mockUsePathname.mockReturnValue('/finances/invoices/inv-123');
      mockUseInvoiceMetadata.mockReturnValue(makeLoadedState(invoice));

      render(<InvoiceDrawer id='inv-123' />);

      expect(screen.getByTestId('invoice-drawer-header')).toBeInTheDocument();
    });

    it('does not render drawer content when pathname does not match invoice id', () => {
      const invoice = createInvoiceDetails({ id: 'inv-123' });
      mockUsePathname.mockReturnValue('/finances/invoices');
      mockUseInvoiceMetadata.mockReturnValue(makeLoadedState(invoice));

      render(<InvoiceDrawer id='inv-123' />);

      expect(screen.queryByTestId('invoice-drawer-header')).not.toBeInTheDocument();
    });
  });

  // -- Loading state --------------------------------------------------------

  describe('loading state', () => {
    it('renders skeleton when metadata is loading', () => {
      mockUseInvoiceMetadata.mockReturnValue(makeLoadingState());
      mockUsePathname.mockReturnValue('/finances/invoices/inv-123');

      render(<InvoiceDrawer id='inv-123' />);

      expect(screen.getByTestId('invoice-drawer-skeleton')).toBeInTheDocument();
    });

    it('does not render content when loading in edit mode', () => {
      mockUseInvoiceMetadata.mockReturnValue(makeLoadingState());
      mockUsePathname.mockReturnValue('/finances/invoices/inv-123');

      render(<InvoiceDrawer id='inv-123' />);

      expect(screen.queryByTestId('invoice-drawer-header')).not.toBeInTheDocument();
    });
  });

  // -- Error state ----------------------------------------------------------

  describe('error state', () => {
    it('renders error message when invoice fails to load', () => {
      mockUsePathname.mockReturnValue('/finances/invoices/inv-123');
      mockUseInvoiceMetadata.mockReturnValue(makeErrorState('Invoice not found'));

      render(<InvoiceDrawer id='inv-123' />);

      expect(screen.getByText(/could not load invoice details/i)).toBeInTheDocument();
      expect(screen.getByText(/invoice not found/i)).toBeInTheDocument();
    });

    it('does not render InvoiceForm when in error state', () => {
      mockUsePathname.mockReturnValue('/finances/invoices/inv-123');
      mockUseInvoiceMetadata.mockReturnValue(makeErrorState());

      render(<InvoiceDrawer id='inv-123' />);

      expect(screen.queryByTestId('invoice-form')).not.toBeInTheDocument();
    });
  });

  // -- Create mode ----------------------------------------------------------

  describe('create mode', () => {
    it('renders InvoiceDrawerHeader in create mode', () => {
      mockUseInvoiceMetadata.mockReturnValue(makeLoadedState());

      render(<InvoiceDrawer open={true} />);

      expect(screen.getByTestId('invoice-drawer-header')).toHaveAttribute('data-mode', 'create');
    });

    it('renders header with New Invoice title in create mode', () => {
      mockUseInvoiceMetadata.mockReturnValue(makeLoadedState());

      render(<InvoiceDrawer open={true} />);

      expect(screen.getByTestId('invoice-drawer-header')).toHaveAttribute(
        'data-title',
        'New Invoice'
      );
    });

    it('renders InvoiceForm directly in create mode', () => {
      mockUseInvoiceMetadata.mockReturnValue(makeLoadedState());

      render(<InvoiceDrawer open={true} />);

      expect(screen.getByTestId('invoice-form')).toBeInTheDocument();
    });

    it('does not render tabs in create mode', () => {
      mockUseInvoiceMetadata.mockReturnValue(makeLoadedState());

      render(<InvoiceDrawer open={true} />);

      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    });
  });

  // -- Edit mode ------------------------------------------------------------

  describe('edit mode', () => {
    it('renders InvoiceDrawerHeader in edit mode', () => {
      const invoice = createInvoiceDetails({ id: 'inv-456', invoiceNumber: 'INV-2024-0001' });
      mockUsePathname.mockReturnValue('/finances/invoices/inv-456');
      mockUseInvoiceMetadata.mockReturnValue(makeLoadedState(invoice));

      render(<InvoiceDrawer id='inv-456' />);

      expect(screen.getByTestId('invoice-drawer-header')).toHaveAttribute('data-mode', 'edit');
    });

    it('renders header with invoice number as title in edit mode', () => {
      const invoice = createInvoiceDetails({ id: 'inv-456', invoiceNumber: 'INV-2024-0099' });
      mockUsePathname.mockReturnValue('/finances/invoices/inv-456');
      mockUseInvoiceMetadata.mockReturnValue(makeLoadedState(invoice));

      render(<InvoiceDrawer id='inv-456' />);

      expect(screen.getByTestId('invoice-drawer-header')).toHaveAttribute(
        'data-title',
        'INV-2024-0099'
      );
    });

    it('renders tabs for details, payments, and history in edit mode', () => {
      const invoice = createInvoiceDetails({ id: 'inv-456' });
      mockUsePathname.mockReturnValue('/finances/invoices/inv-456');
      mockUseInvoiceMetadata.mockReturnValue(makeLoadedState(invoice));

      render(<InvoiceDrawer id='inv-456' />);

      expect(screen.getByRole('tab', { name: /invoice details/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /payments/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /history/i })).toBeInTheDocument();
    });

    it('renders InvoiceForm in the details tab by default', () => {
      const invoice = createInvoiceDetails({ id: 'inv-456' });
      mockUsePathname.mockReturnValue('/finances/invoices/inv-456');
      mockUseInvoiceMetadata.mockReturnValue(makeLoadedState(invoice));

      render(<InvoiceDrawer id='inv-456' />);

      expect(screen.getByTestId('invoice-form')).toBeInTheDocument();
    });

    it('shows payment count badge when invoice has payments', () => {
      const invoice = createInvoiceDetails({
        id: 'inv-456',
        _count: { payments: 3, statusHistory: 0, items: 1 }
      } as Parameters<typeof createInvoiceDetails>[0]);
      mockUsePathname.mockReturnValue('/finances/invoices/inv-456');
      mockUseInvoiceMetadata.mockReturnValue(makeLoadedState(invoice));

      render(<InvoiceDrawer id='inv-456' />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('shows history count badge when invoice has status history', () => {
      const invoice = createInvoiceDetails({
        id: 'inv-456',
        _count: { payments: 0, statusHistory: 5, items: 1 }
      } as Parameters<typeof createInvoiceDetails>[0]);
      mockUsePathname.mockReturnValue('/finances/invoices/inv-456');
      mockUseInvoiceMetadata.mockReturnValue(makeLoadedState(invoice));

      render(<InvoiceDrawer id='inv-456' />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  // -- Email preview dialog -------------------------------------------------

  describe('email preview dialog', () => {
    it('does not render EmailPreviewDialog by default', () => {
      mockUseInvoiceMetadata.mockReturnValue(makeLoadedState());

      render(<InvoiceDrawer open={true} />);

      expect(screen.queryByTestId('email-preview-dialog')).not.toBeInTheDocument();
    });
  });

  // -- Unsaved changes dialog -----------------------------------------------

  describe('unsaved changes dialog', () => {
    it('does not render UnsavedChangesDialog by default', () => {
      mockUseInvoiceMetadata.mockReturnValue(makeLoadedState());

      render(<InvoiceDrawer open={true} />);

      expect(screen.queryByTestId('unsaved-changes-dialog')).not.toBeInTheDocument();
    });
  });
});
