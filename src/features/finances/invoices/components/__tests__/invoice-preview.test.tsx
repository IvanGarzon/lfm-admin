// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { InvoicePreview } from '../invoice-preview';
import type { InvoiceMetadata, InvoiceItemDetail, InvoicePaymentItem } from '../../types';
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
    bankName: 'Commonwealth Bank',
    bsb: '062-000',
    accountNumber: '12345678',
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

vi.mock('@/features/finances/invoices/components/preview/invoice-preview-header', () => ({
  InvoicePreviewHeader: ({ invoiceNumber }: { invoiceNumber: string }) => (
    <div data-testid='invoice-preview-header' data-invoice-number={invoiceNumber} />
  )
}));

vi.mock('@/features/finances/invoices/components/preview/invoice-preview-billing-info', () => ({
  InvoicePreviewBillingInfo: ({ invoice }: { invoice: InvoiceMetadata }) => (
    <div data-testid='invoice-preview-billing-info' data-customer={invoice.customer.firstName} />
  )
}));

vi.mock('@/features/finances/invoices/components/preview/invoice-preview-items-table', () => ({
  InvoicePreviewItemsTable: ({
    items,
    isLoadingItems
  }: {
    items: InvoiceItemDetail[];
    isLoadingItems: boolean;
  }) => (
    <div
      data-testid='invoice-preview-items-table'
      data-item-count={items.length}
      data-loading={isLoadingItems}
    />
  )
}));

vi.mock('@/features/finances/invoices/components/preview/invoice-preview-summary', () => ({
  InvoicePreviewSummary: ({
    subtotal,
    total
  }: {
    invoice: InvoiceMetadata;
    subtotal: number;
    gstAmount: number;
    total: number;
  }) => <div data-testid='invoice-preview-summary' data-subtotal={subtotal} data-total={total} />
}));

vi.mock('@/features/finances/invoices/components/preview/invoice-preview-payments', () => ({
  InvoicePreviewPayments: ({
    payments,
    isLoadingPayments
  }: {
    payments: InvoicePaymentItem[];
    isLoadingPayments: boolean;
  }) => (
    <div
      data-testid='invoice-preview-payments'
      data-payment-count={payments.length}
      data-loading={isLoadingPayments}
    />
  )
}));

// -- Tests ------------------------------------------------------------------

describe('InvoicePreview', () => {
  // -- Rendering with data --------------------------------------------------

  describe('rendering with data', () => {
    it('renders all sub-components', () => {
      render(<InvoicePreview invoice={createInvoiceMetadata()} />);

      expect(screen.getByTestId('invoice-preview-header')).toBeInTheDocument();
      expect(screen.getByTestId('invoice-preview-billing-info')).toBeInTheDocument();
      expect(screen.getByTestId('invoice-preview-items-table')).toBeInTheDocument();
      expect(screen.getByTestId('invoice-preview-summary')).toBeInTheDocument();
      expect(screen.getByTestId('invoice-preview-payments')).toBeInTheDocument();
    });

    it('passes the invoice number to the header', () => {
      render(<InvoicePreview invoice={createInvoiceMetadata({ invoiceNumber: 'INV-042' })} />);

      expect(screen.getByTestId('invoice-preview-header')).toHaveAttribute(
        'data-invoice-number',
        'INV-042'
      );
    });

    it('passes item count to items table', () => {
      const items = [createInvoiceItemDetail(), createInvoiceItemDetail({ id: 'item-2' })];
      render(<InvoicePreview invoice={createInvoiceMetadata()} items={items} />);

      expect(screen.getByTestId('invoice-preview-items-table')).toHaveAttribute(
        'data-item-count',
        '2'
      );
    });

    it('passes payment count to payments', () => {
      const payments = [createInvoicePaymentItem()];
      render(<InvoicePreview invoice={createInvoiceMetadata()} payments={payments} />);

      expect(screen.getByTestId('invoice-preview-payments')).toHaveAttribute(
        'data-payment-count',
        '1'
      );
    });

    it('renders the invoice reference in payment details', () => {
      render(<InvoicePreview invoice={createInvoiceMetadata({ invoiceNumber: 'INV-007' })} />);

      expect(screen.getByText('INV-007')).toBeInTheDocument();
    });

    it('renders branding bank details when available', () => {
      render(<InvoicePreview invoice={createInvoiceMetadata()} />);

      expect(screen.getByText(/Commonwealth Bank/)).toBeInTheDocument();
      expect(screen.getByText(/062-000/)).toBeInTheDocument();
      expect(screen.getByText(/12345678/)).toBeInTheDocument();
    });

    it('renders notes when provided', () => {
      render(<InvoicePreview invoice={createInvoiceMetadata({ notes: 'Please pay promptly.' })} />);

      expect(screen.getByText('Please pay promptly.')).toBeInTheDocument();
    });

    it('does not render notes section when notes is absent', () => {
      render(<InvoicePreview invoice={createInvoiceMetadata({ notes: undefined })} />);

      expect(screen.queryByText('Notes:')).not.toBeInTheDocument();
    });
  });

  // -- Totals calculation ---------------------------------------------------

  describe('totals calculation', () => {
    it('passes correct subtotal to summary when items are provided', () => {
      const items = [
        createInvoiceItemDetail({ total: 300 }),
        createInvoiceItemDetail({ id: 'item-2', total: 200 })
      ];
      render(
        <InvoicePreview invoice={createInvoiceMetadata({ gst: 10, discount: 0 })} items={items} />
      );

      expect(screen.getByTestId('invoice-preview-summary')).toHaveAttribute('data-subtotal', '500');
    });

    it('passes correct total (subtotal + gst - discount) to summary', () => {
      const items = [createInvoiceItemDetail({ total: 1000 })];
      // subtotal=1000, gst=10% => gstAmount=100, discount=50 => total=1050
      render(
        <InvoicePreview invoice={createInvoiceMetadata({ gst: 10, discount: 50 })} items={items} />
      );

      expect(screen.getByTestId('invoice-preview-summary')).toHaveAttribute('data-total', '1050');
    });
  });

  // -- Loading state --------------------------------------------------------

  describe('loading state', () => {
    it('passes isLoadingItems=true to items table', () => {
      render(<InvoicePreview invoice={createInvoiceMetadata()} isLoadingItems={true} />);

      expect(screen.getByTestId('invoice-preview-items-table')).toHaveAttribute(
        'data-loading',
        'true'
      );
    });

    it('passes isLoadingPayments=true to payments', () => {
      render(<InvoicePreview invoice={createInvoiceMetadata()} isLoadingPayments={true} />);

      expect(screen.getByTestId('invoice-preview-payments')).toHaveAttribute(
        'data-loading',
        'true'
      );
    });
  });

  // -- Empty state ----------------------------------------------------------

  describe('empty state (no items or payments)', () => {
    it('renders with zero items by default', () => {
      render(<InvoicePreview invoice={createInvoiceMetadata()} />);

      expect(screen.getByTestId('invoice-preview-items-table')).toHaveAttribute(
        'data-item-count',
        '0'
      );
    });

    it('renders with zero payments by default', () => {
      render(<InvoicePreview invoice={createInvoiceMetadata()} />);

      expect(screen.getByTestId('invoice-preview-payments')).toHaveAttribute(
        'data-payment-count',
        '0'
      );
    });

    it('renders a zero subtotal and total when there are no items', () => {
      render(<InvoicePreview invoice={createInvoiceMetadata({ gst: 10, discount: 0 })} />);

      expect(screen.getByTestId('invoice-preview-summary')).toHaveAttribute('data-subtotal', '0');
      expect(screen.getByTestId('invoice-preview-summary')).toHaveAttribute('data-total', '0');
    });
  });

  // -- Branding (null/missing) -----------------------------------------------

  describe('when branding fields are absent', () => {
    it('does not crash when branding returns null', async () => {
      const { useTenantBranding } = await import('@/components/providers/TenantBrandingProvider');
      vi.mocked(useTenantBranding).mockReturnValueOnce(null);

      render(<InvoicePreview invoice={createInvoiceMetadata()} />);

      expect(screen.getByTestId('invoice-preview-header')).toBeInTheDocument();
    });
  });
});
