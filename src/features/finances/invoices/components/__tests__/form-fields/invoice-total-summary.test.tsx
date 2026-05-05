// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { InvoiceTotalSummary } from '../../form-fields/invoice-total-summary';

// -- Tests ------------------------------------------------------------------

describe('InvoiceTotalSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Rendering ------------------------------------------------------------

  describe('rendering', () => {
    it('renders Subtotal label', () => {
      render(
        <InvoiceTotalSummary subtotal={100} gst={10} gstAmount={10} discount={0} total={110} />
      );

      expect(screen.getByText('Subtotal:')).toBeInTheDocument();
    });

    it('renders GST label with percentage', () => {
      render(
        <InvoiceTotalSummary subtotal={100} gst={10} gstAmount={10} discount={0} total={110} />
      );

      expect(screen.getByText('Gst (10%):')).toBeInTheDocument();
    });

    it('renders Invoice Total label', () => {
      render(
        <InvoiceTotalSummary subtotal={100} gst={10} gstAmount={10} discount={0} total={110} />
      );

      expect(screen.getByText('Invoice Total:')).toBeInTheDocument();
    });
  });

  // -- Currency formatting --------------------------------------------------

  describe('currency formatting', () => {
    it('renders formatted subtotal', () => {
      render(
        <InvoiceTotalSummary subtotal={200} gst={10} gstAmount={20} discount={0} total={220} />
      );

      expect(screen.getByText('$200.00')).toBeInTheDocument();
    });

    it('renders formatted GST amount', () => {
      render(
        <InvoiceTotalSummary subtotal={200} gst={10} gstAmount={20} discount={0} total={220} />
      );

      expect(screen.getByText('$20.00')).toBeInTheDocument();
    });

    it('renders formatted total', () => {
      render(
        <InvoiceTotalSummary subtotal={200} gst={10} gstAmount={20} discount={0} total={220} />
      );

      expect(screen.getByText('$220.00')).toBeInTheDocument();
    });
  });

  // -- Discount row ---------------------------------------------------------

  describe('discount row', () => {
    it('does not render discount row when discount is zero', () => {
      render(
        <InvoiceTotalSummary subtotal={100} gst={10} gstAmount={10} discount={0} total={110} />
      );

      expect(screen.queryByText('Discount:')).not.toBeInTheDocument();
    });

    it('renders discount row when discount is greater than zero', () => {
      render(
        <InvoiceTotalSummary subtotal={100} gst={10} gstAmount={10} discount={15} total={95} />
      );

      expect(screen.getByText('Discount:')).toBeInTheDocument();
    });

    it('renders formatted negative discount amount', () => {
      render(
        <InvoiceTotalSummary subtotal={100} gst={10} gstAmount={10} discount={15} total={95} />
      );

      expect(screen.getByText('-$15.00')).toBeInTheDocument();
    });
  });

  // -- GST percentage display -----------------------------------------------

  describe('GST percentage display', () => {
    it('shows 0% GST label when gst is zero', () => {
      render(<InvoiceTotalSummary subtotal={100} gst={0} gstAmount={0} discount={0} total={100} />);

      expect(screen.getByText('Gst (0%):')).toBeInTheDocument();
    });

    it('shows correct percentage in GST label for non-standard rates', () => {
      render(<InvoiceTotalSummary subtotal={100} gst={5} gstAmount={5} discount={0} total={105} />);

      expect(screen.getByText('Gst (5%):')).toBeInTheDocument();
    });
  });
});
