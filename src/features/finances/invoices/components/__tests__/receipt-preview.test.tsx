// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ReceiptPreview } from '../receipt-preview';
import {
  createInvoiceMetadata,
  createInvoiceItemDetail,
  createInvoicePaymentItem
} from '@/lib/testing/factories/invoice.factory';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/components/providers/TenantBrandingProvider', () => ({
  useTenantBranding: vi.fn(() => ({
    name: 'Las Flores Melbourne',
    accountName: 'Las Flores Pty Ltd',
    phone: '03 9999 0000',
    email: 'accounts@lasflores.com.au',
    abn: '12 345 678 901'
  }))
}));

vi.mock('@/components/ui/box', () => ({
  Box: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  )
}));

vi.mock('@/lib/utils', () => ({
  formatCurrency: ({ number }: { number: number }) => `$${number.toFixed(2)}`
}));

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    width,
    height
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
    priority?: boolean;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} data-testid='logo' />
  )
}));

// -- Tests ------------------------------------------------------------------

describe('ReceiptPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Rendering with data --------------------------------------------------

  describe('rendering with data', () => {
    it('renders the Receipt heading', () => {
      render(<ReceiptPreview invoice={createInvoiceMetadata()} />);

      expect(screen.getByRole('heading', { name: 'Receipt' })).toBeInTheDocument();
    });

    it('renders the invoice number', () => {
      render(<ReceiptPreview invoice={createInvoiceMetadata({ invoiceNumber: 'INV-042' })} />);

      expect(screen.getByText(/#INV-042/)).toBeInTheDocument();
    });

    it('renders the receipt number', () => {
      render(<ReceiptPreview invoice={createInvoiceMetadata({ receiptNumber: 'RCT-007' })} />);

      expect(screen.getByText(/#RCT-007/)).toBeInTheDocument();
    });

    it('renders the formatted paid date', () => {
      render(
        <ReceiptPreview invoice={createInvoiceMetadata({ paidDate: new Date('2025-03-15') })} />
      );

      expect(screen.getAllByText(/Mar 15, 2025/).length).toBeGreaterThan(0);
    });

    it('renders N/A when paidDate is absent', () => {
      render(<ReceiptPreview invoice={createInvoiceMetadata({ paidDate: null })} />);

      expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
    });

    it('renders the payment method', () => {
      render(<ReceiptPreview invoice={createInvoiceMetadata({ paymentMethod: 'EFT' })} />);

      expect(screen.getByText('EFT')).toBeInTheDocument();
    });

    it('renders N/A when paymentMethod is absent', () => {
      render(
        <ReceiptPreview
          invoice={createInvoiceMetadata({ paymentMethod: null, paidDate: new Date('2025-01-20') })}
        />
      );

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('renders the customer name', () => {
      render(
        <ReceiptPreview
          invoice={createInvoiceMetadata({
            customer: {
              id: 'c1',
              firstName: 'Alice',
              lastName: 'Wong',
              email: 'alice@example.com',
              phone: null,
              organization: null
            }
          })}
        />
      );

      expect(screen.getByText('Alice Wong')).toBeInTheDocument();
    });

    it('renders the customer email', () => {
      render(<ReceiptPreview invoice={createInvoiceMetadata()} />);

      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('renders the customer organisation name when present', () => {
      render(
        <ReceiptPreview
          invoice={createInvoiceMetadata({
            customer: {
              id: 'c1',
              firstName: 'Jane',
              lastName: 'Smith',
              email: 'jane@example.com',
              phone: null,
              organization: { id: 'org-1', name: 'Acme Corp' }
            }
          })}
        />
      );

      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    it('renders the branding account name', () => {
      render(<ReceiptPreview invoice={createInvoiceMetadata()} />);

      expect(screen.getByText('Las Flores Pty Ltd')).toBeInTheDocument();
    });

    it('renders the logo image', () => {
      render(<ReceiptPreview invoice={createInvoiceMetadata()} />);

      expect(screen.getByTestId('logo')).toBeInTheDocument();
    });

    it('renders the thank you message', () => {
      render(<ReceiptPreview invoice={createInvoiceMetadata()} />);

      expect(screen.getByText('Thank you for your business!')).toBeInTheDocument();
    });
  });

  // -- Items table ----------------------------------------------------------

  describe('items table', () => {
    it('renders item rows with description', () => {
      const items = [createInvoiceItemDetail({ description: 'Private lesson' })];
      render(<ReceiptPreview invoice={createInvoiceMetadata()} items={items} />);

      expect(screen.getByText('Private lesson')).toBeInTheDocument();
    });

    it('renders item quantity', () => {
      const items = [createInvoiceItemDetail({ quantity: 3 })];
      render(<ReceiptPreview invoice={createInvoiceMetadata()} items={items} />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('renders skeleton rows when isLoadingItems is true', () => {
      const { container } = render(
        <ReceiptPreview invoice={createInvoiceMetadata()} isLoadingItems={true} />
      );

      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });

    it('renders no item rows when items list is empty', () => {
      render(<ReceiptPreview invoice={createInvoiceMetadata()} items={[]} />);

      expect(screen.queryByText('Dance class package')).not.toBeInTheDocument();
    });
  });

  // -- Summary section ------------------------------------------------------

  describe('summary section', () => {
    it('renders Subtotal label', () => {
      render(<ReceiptPreview invoice={createInvoiceMetadata()} />);

      expect(screen.getByText('Subtotal')).toBeInTheDocument();
    });

    it('renders Total Paid label', () => {
      render(<ReceiptPreview invoice={createInvoiceMetadata()} />);

      expect(screen.getByText('Total Paid')).toBeInTheDocument();
    });

    it('renders the discount row when discount is greater than zero', () => {
      render(<ReceiptPreview invoice={createInvoiceMetadata({ discount: 50 })} />);

      expect(screen.getByText('Discount')).toBeInTheDocument();
    });

    it('does not render the discount row when discount is zero', () => {
      render(<ReceiptPreview invoice={createInvoiceMetadata({ discount: 0 })} />);

      expect(screen.queryByText('Discount')).not.toBeInTheDocument();
    });

    it('renders GST label with the invoice gst rate', () => {
      render(<ReceiptPreview invoice={createInvoiceMetadata({ gst: 10 })} />);

      expect(screen.getByText(/GST \(10%\)/)).toBeInTheDocument();
    });
  });

  // -- Payment history ------------------------------------------------------

  describe('payment history', () => {
    it('renders the Payment History section when payments are provided', () => {
      const payments = [createInvoicePaymentItem()];
      render(<ReceiptPreview invoice={createInvoiceMetadata()} payments={payments} />);

      expect(screen.getByText('Payment History')).toBeInTheDocument();
    });

    it('renders payment method in history table', () => {
      const payments = [createInvoicePaymentItem({ method: 'Cash' })];
      render(<ReceiptPreview invoice={createInvoiceMetadata()} payments={payments} />);

      expect(screen.getByText('Cash')).toBeInTheDocument();
    });

    it('renders payment notes when present', () => {
      const payments = [createInvoicePaymentItem({ notes: 'Paid at front desk' })];
      render(<ReceiptPreview invoice={createInvoiceMetadata()} payments={payments} />);

      expect(screen.getByText('Paid at front desk')).toBeInTheDocument();
    });

    it('does not render Payment History section when payments list is empty', () => {
      render(<ReceiptPreview invoice={createInvoiceMetadata()} payments={[]} />);

      expect(screen.queryByText('Payment History')).not.toBeInTheDocument();
    });

    it('renders skeleton rows for payments when isLoadingPayments is true and payments exist', () => {
      const payments = [createInvoicePaymentItem()];
      const { container } = render(
        <ReceiptPreview
          invoice={createInvoiceMetadata()}
          payments={payments}
          isLoadingPayments={true}
        />
      );

      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });
  });

  // -- Notes ----------------------------------------------------------------

  describe('notes section', () => {
    it('renders notes when present', () => {
      render(
        <ReceiptPreview
          invoice={createInvoiceMetadata({ notes: 'Thank you for your prompt payment.' })}
        />
      );

      expect(screen.getByText('Thank you for your prompt payment.')).toBeInTheDocument();
    });

    it('does not render notes section when notes is absent', () => {
      render(<ReceiptPreview invoice={createInvoiceMetadata({ notes: undefined })} />);

      expect(screen.queryByText('Notes:')).not.toBeInTheDocument();
    });
  });
});
