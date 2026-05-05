// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { InvoicePreviewPayments } from '../../preview/invoice-preview-payments';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  return {
    ...actual,
    formatCurrency: ({ number }: { number: number }) => `$${number.toFixed(2)}`
  };
});

vi.mock('date-fns', () => ({
  format: (_date: Date, _fmt: string) => 'Jan 15, 2025'
}));

// -- Helpers ----------------------------------------------------------------

import { createInvoicePaymentItem } from '@/lib/testing/factories/invoice.factory';

// -- Tests ------------------------------------------------------------------

describe('InvoicePreviewPayments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Empty / hidden state -------------------------------------------------

  describe('when no payments and not loading', () => {
    it('renders nothing', () => {
      const { container } = render(<InvoicePreviewPayments payments={[]} />);

      expect(container).toBeEmptyDOMElement();
    });
  });

  // -- Column headers -------------------------------------------------------

  describe('column headers', () => {
    it('renders Date column header', () => {
      render(<InvoicePreviewPayments payments={[createInvoicePaymentItem()]} />);

      expect(screen.getByText('Date')).toBeInTheDocument();
    });

    it('renders Method column header', () => {
      render(<InvoicePreviewPayments payments={[createInvoicePaymentItem()]} />);

      expect(screen.getByText('Method')).toBeInTheDocument();
    });

    it('renders Notes column header', () => {
      render(<InvoicePreviewPayments payments={[createInvoicePaymentItem()]} />);

      expect(screen.getByText('Notes')).toBeInTheDocument();
    });

    it('renders Amount column header', () => {
      render(<InvoicePreviewPayments payments={[createInvoicePaymentItem()]} />);

      expect(screen.getByText('Amount')).toBeInTheDocument();
    });
  });

  // -- Payment rows ---------------------------------------------------------

  describe('payment rows', () => {
    it('renders formatted date', () => {
      render(<InvoicePreviewPayments payments={[createInvoicePaymentItem()]} />);

      expect(screen.getByText('Jan 15, 2025')).toBeInTheDocument();
    });

    it('renders payment method', () => {
      render(
        <InvoicePreviewPayments payments={[createInvoicePaymentItem({ method: 'Credit Card' })]} />
      );

      expect(screen.getByText('Credit Card')).toBeInTheDocument();
    });

    it('renders formatted amount', () => {
      render(<InvoicePreviewPayments payments={[createInvoicePaymentItem({ amount: 350 })]} />);

      expect(screen.getByText('$350.00')).toBeInTheDocument();
    });

    it('renders dash when notes is null', () => {
      render(<InvoicePreviewPayments payments={[createInvoicePaymentItem({ notes: null })]} />);

      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('renders notes text when present', () => {
      render(
        <InvoicePreviewPayments
          payments={[createInvoicePaymentItem({ notes: 'Partial payment' })]}
        />
      );

      expect(screen.getByText('Partial payment')).toBeInTheDocument();
    });

    it('renders multiple payment rows', () => {
      const payments = [
        createInvoicePaymentItem({ id: 'pay-1', method: 'Cash' }),
        createInvoicePaymentItem({ id: 'pay-2', method: 'EFTPOS' })
      ];

      render(<InvoicePreviewPayments payments={payments} />);

      expect(screen.getByText('Cash')).toBeInTheDocument();
      expect(screen.getByText('EFTPOS')).toBeInTheDocument();
    });

    it('renders the Payment History section heading', () => {
      render(<InvoicePreviewPayments payments={[createInvoicePaymentItem()]} />);

      expect(screen.getByText('Payment History')).toBeInTheDocument();
    });
  });

  // -- Loading state --------------------------------------------------------

  describe('loading state', () => {
    it('renders skeleton rows when isLoadingPayments is true', () => {
      render(<InvoicePreviewPayments payments={[]} isLoadingPayments />);

      const rows = screen.getAllByRole('row');
      // 1 header + 2 skeleton rows
      expect(rows).toHaveLength(3);
    });

    it('does not render payment method text when loading', () => {
      render(
        <InvoicePreviewPayments
          payments={[createInvoicePaymentItem({ method: 'Should not appear' })]}
          isLoadingPayments
        />
      );

      expect(screen.queryByText('Should not appear')).not.toBeInTheDocument();
    });

    it('renders payment rows when isLoadingPayments is false', () => {
      render(
        <InvoicePreviewPayments
          payments={[createInvoicePaymentItem({ method: 'Direct Debit' })]}
          isLoadingPayments={false}
        />
      );

      expect(screen.getByText('Direct Debit')).toBeInTheDocument();
    });
  });
});
