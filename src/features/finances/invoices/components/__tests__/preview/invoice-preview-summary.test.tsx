// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { InvoicePreviewSummary } from '../../preview/invoice-preview-summary';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  return {
    ...actual,
    formatCurrency: ({ number }: { number: number }) => `$${number.toFixed(2)}`
  };
});

// -- Helpers ----------------------------------------------------------------

import { createInvoiceMetadata } from '@/lib/testing/factories/invoice.factory';

// -- Tests ------------------------------------------------------------------

describe('InvoicePreviewSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Subtotal -------------------------------------------------------------

  describe('subtotal', () => {
    it('renders Subtotal label', () => {
      render(
        <InvoicePreviewSummary
          invoice={createInvoiceMetadata()}
          subtotal={100}
          gstAmount={10}
          total={110}
        />
      );

      expect(screen.getByText('Subtotal')).toBeInTheDocument();
    });

    it('renders formatted subtotal amount', () => {
      render(
        <InvoicePreviewSummary
          invoice={createInvoiceMetadata()}
          subtotal={100}
          gstAmount={10}
          total={110}
        />
      );

      expect(screen.getByText('$100.00')).toBeInTheDocument();
    });
  });

  // -- GST ------------------------------------------------------------------

  describe('GST', () => {
    it('renders GST label with percentage from invoice', () => {
      render(
        <InvoicePreviewSummary
          invoice={createInvoiceMetadata({ gst: 10 })}
          subtotal={100}
          gstAmount={10}
          total={110}
        />
      );

      expect(screen.getByText('GST (10%)')).toBeInTheDocument();
    });

    it('renders formatted GST amount', () => {
      render(
        <InvoicePreviewSummary
          invoice={createInvoiceMetadata({ gst: 10 })}
          subtotal={100}
          gstAmount={10}
          total={110}
        />
      );

      expect(screen.getByText('$10.00')).toBeInTheDocument();
    });
  });

  // -- Discount -------------------------------------------------------------

  describe('discount', () => {
    it('renders Discount row when discount is greater than zero', () => {
      render(
        <InvoicePreviewSummary
          invoice={createInvoiceMetadata({ discount: 20 })}
          subtotal={100}
          gstAmount={10}
          total={90}
        />
      );

      expect(screen.getByText('Discount')).toBeInTheDocument();
      expect(screen.getByText('-$20.00')).toBeInTheDocument();
    });

    it('does not render Discount row when discount is zero', () => {
      render(
        <InvoicePreviewSummary
          invoice={createInvoiceMetadata({ discount: 0 })}
          subtotal={100}
          gstAmount={10}
          total={110}
        />
      );

      expect(screen.queryByText('Discount')).not.toBeInTheDocument();
    });
  });

  // -- Invoice Total --------------------------------------------------------

  describe('invoice total', () => {
    it('renders Invoice Total label', () => {
      render(
        <InvoicePreviewSummary
          invoice={createInvoiceMetadata()}
          subtotal={100}
          gstAmount={10}
          total={110}
        />
      );

      expect(screen.getByText('Invoice Total')).toBeInTheDocument();
    });

    it('renders formatted total amount', () => {
      render(
        <InvoicePreviewSummary
          invoice={createInvoiceMetadata()}
          subtotal={100}
          gstAmount={10}
          total={110}
        />
      );

      expect(screen.getByText('$110.00')).toBeInTheDocument();
    });
  });

  // -- Amount Paid / Amount Due ---------------------------------------------

  describe('amount paid and amount due', () => {
    it('renders Amount Paid and Amount Due when amountPaid is greater than zero', () => {
      render(
        <InvoicePreviewSummary
          invoice={createInvoiceMetadata({ amountPaid: 50, amountDue: 60 })}
          subtotal={100}
          gstAmount={10}
          total={110}
        />
      );

      expect(screen.getByText('Amount Paid')).toBeInTheDocument();
      expect(screen.getByText('Amount Due')).toBeInTheDocument();
    });

    it('renders formatted amountPaid with negative prefix', () => {
      render(
        <InvoicePreviewSummary
          invoice={createInvoiceMetadata({ amountPaid: 50, amountDue: 60 })}
          subtotal={100}
          gstAmount={10}
          total={110}
        />
      );

      expect(screen.getByText('-$50.00')).toBeInTheDocument();
    });

    it('renders formatted amountDue', () => {
      render(
        <InvoicePreviewSummary
          invoice={createInvoiceMetadata({ amountPaid: 50, amountDue: 60 })}
          subtotal={100}
          gstAmount={10}
          total={110}
        />
      );

      expect(screen.getByText('$60.00')).toBeInTheDocument();
    });

    it('does not render Amount Paid or Amount Due when amountPaid is zero', () => {
      render(
        <InvoicePreviewSummary
          invoice={createInvoiceMetadata({ amountPaid: 0, amountDue: 110 })}
          subtotal={100}
          gstAmount={10}
          total={110}
        />
      );

      expect(screen.queryByText('Amount Paid')).not.toBeInTheDocument();
      expect(screen.queryByText('Amount Due')).not.toBeInTheDocument();
    });
  });
});
