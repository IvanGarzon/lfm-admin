// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { InvoicePayments } from '../invoice-payments';
import { createInvoicePaymentItem } from '@/lib/testing/factories/invoice.factory';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/features/finances/invoices/components/invoice-status-badge', () => ({
  InvoiceStatusBadge: ({ status }: { status: string }) => (
    <span data-testid='status-badge' data-status={status} />
  )
}));

// -- Tests ------------------------------------------------------------------

describe('InvoicePayments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Rendering with payments ----------------------------------------------

  describe('with payments', () => {
    it('renders a payment row for each payment', () => {
      const payments = [
        createInvoicePaymentItem({ id: 'p-1', amount: 50 }),
        createInvoicePaymentItem({ id: 'p-2', amount: 30 })
      ];

      render(<InvoicePayments payments={payments} invoiceAmount={100} />);

      expect(screen.getAllByTestId('status-badge')).toHaveLength(2);
    });

    it('displays the payment method', () => {
      const payments = [createInvoicePaymentItem({ method: 'Bank Transfer' })];

      render(<InvoicePayments payments={payments} invoiceAmount={100} />);

      expect(screen.getByText('Bank Transfer')).toBeInTheDocument();
    });

    it('displays PAID status badge when payment covers the full invoice amount', () => {
      const payments = [createInvoicePaymentItem({ amount: 100 })];

      render(<InvoicePayments payments={payments} invoiceAmount={100} />);

      expect(screen.getByTestId('status-badge')).toHaveAttribute('data-status', 'PAID');
    });

    it('displays PARTIALLY_PAID status badge when payment covers less than the invoice amount', () => {
      const payments = [createInvoicePaymentItem({ amount: 40 })];

      render(<InvoicePayments payments={payments} invoiceAmount={100} />);

      expect(screen.getByTestId('status-badge')).toHaveAttribute('data-status', 'PARTIALLY_PAID');
    });

    it('displays the reference when provided', () => {
      const payments = [createInvoicePaymentItem({ reference: 'REF-001' })];

      render(<InvoicePayments payments={payments} invoiceAmount={100} />);

      expect(screen.getByText('Ref: REF-001')).toBeInTheDocument();
    });

    it('does not display a reference row when reference is null', () => {
      const payments = [createInvoicePaymentItem({ reference: null })];

      render(<InvoicePayments payments={payments} invoiceAmount={100} />);

      expect(screen.queryByText(/^Ref:/)).not.toBeInTheDocument();
    });

    it('displays notes when provided', () => {
      const payments = [createInvoicePaymentItem({ notes: 'Partial payment agreed.' })];

      render(<InvoicePayments payments={payments} invoiceAmount={100} />);

      expect(screen.getByText('Partial payment agreed.')).toBeInTheDocument();
    });

    it('does not display a notes row when notes are null', () => {
      const payments = [createInvoicePaymentItem({ notes: null })];

      render(<InvoicePayments payments={payments} invoiceAmount={100} />);

      expect(screen.queryByText(/partial payment agreed/i)).not.toBeInTheDocument();
    });

    it('shows PAID on the last payment when cumulative total covers the invoice', () => {
      const payments = [
        createInvoicePaymentItem({ id: 'p-1', amount: 60, date: new Date('2024-01-01') }),
        createInvoicePaymentItem({ id: 'p-2', amount: 40, date: new Date('2024-01-02') })
      ];

      render(<InvoicePayments payments={payments} invoiceAmount={100} />);

      const badges = screen.getAllByTestId('status-badge');
      expect(badges[0]).toHaveAttribute('data-status', 'PARTIALLY_PAID');
      expect(badges[1]).toHaveAttribute('data-status', 'PAID');
    });
  });

  // -- Empty state ----------------------------------------------------------

  describe('with no payments', () => {
    it('renders no payment rows', () => {
      render(<InvoicePayments payments={[]} invoiceAmount={100} />);

      expect(screen.queryByTestId('status-badge')).not.toBeInTheDocument();
    });
  });
});
