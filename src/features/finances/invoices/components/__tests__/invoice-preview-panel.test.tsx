// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { InvoicePreviewPanel } from '../invoice-preview-panel';
import type { InvoiceMetadata, InvoiceItemDetail, InvoicePaymentItem } from '../../types';
import {
  createInvoiceMetadata,
  createInvoiceItemDetail,
  createInvoicePaymentItem
} from '@/lib/testing/factories/invoice.factory';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/components/ui/box', () => ({
  Box: ({
    children,
    className,
    style
  }: {
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
  }) => (
    <div className={className} style={style}>
      {children}
    </div>
  )
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    'aria-label': ariaLabel
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    'aria-label'?: string;
    type?: string;
    variant?: string;
    size?: string;
  }) => (
    <button aria-label={ariaLabel} onClick={onClick}>
      {children}
    </button>
  )
}));

vi.mock('next/dynamic', () => ({
  default: (_loader: unknown, options?: { loading?: () => React.ReactElement }) => {
    return function InvoicePreviewStub({
      invoice,
      items,
      payments,
      isLoadingItems,
      isLoadingPayments
    }: {
      invoice: InvoiceMetadata;
      items?: InvoiceItemDetail[];
      payments?: InvoicePaymentItem[];
      isLoadingItems?: boolean;
      isLoadingPayments?: boolean;
    }) {
      return (
        <div
          data-testid='invoice-preview'
          data-invoice-number={invoice.invoiceNumber}
          data-item-count={items?.length ?? 0}
          data-payment-count={payments?.length ?? 0}
          data-loading-items={isLoadingItems}
          data-loading-payments={isLoadingPayments}
        />
      );
    };
  }
}));

vi.mock('lucide-react', () => ({
  Download: () => <svg aria-hidden='true' data-testid='download-icon' />
}));

// -- Tests ------------------------------------------------------------------

describe('InvoicePreviewPanel', () => {
  const onDownloadPdf = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Rendering with data --------------------------------------------------

  describe('rendering with data', () => {
    it('renders the Preview heading', () => {
      render(
        <InvoicePreviewPanel invoice={createInvoiceMetadata()} onDownloadPdf={onDownloadPdf} />
      );

      expect(screen.getByText('Preview')).toBeInTheDocument();
    });

    it('renders the Download PDF button', () => {
      render(
        <InvoicePreviewPanel invoice={createInvoiceMetadata()} onDownloadPdf={onDownloadPdf} />
      );

      expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument();
    });

    it('renders the InvoicePreview with the correct invoice', () => {
      render(
        <InvoicePreviewPanel
          invoice={createInvoiceMetadata({ invoiceNumber: 'INV-099' })}
          onDownloadPdf={onDownloadPdf}
        />
      );

      expect(screen.getByTestId('invoice-preview')).toHaveAttribute(
        'data-invoice-number',
        'INV-099'
      );
    });

    it('passes items to InvoicePreview', () => {
      const items = [createInvoiceItemDetail(), createInvoiceItemDetail({ id: 'item-2' })];
      render(
        <InvoicePreviewPanel
          invoice={createInvoiceMetadata()}
          items={items}
          onDownloadPdf={onDownloadPdf}
        />
      );

      expect(screen.getByTestId('invoice-preview')).toHaveAttribute('data-item-count', '2');
    });

    it('passes payments to InvoicePreview', () => {
      const payments = [createInvoicePaymentItem()];
      render(
        <InvoicePreviewPanel
          invoice={createInvoiceMetadata()}
          payments={payments}
          onDownloadPdf={onDownloadPdf}
        />
      );

      expect(screen.getByTestId('invoice-preview')).toHaveAttribute('data-payment-count', '1');
    });
  });

  // -- Loading state --------------------------------------------------------

  describe('loading state', () => {
    it('passes isLoadingItems to InvoicePreview', () => {
      render(
        <InvoicePreviewPanel
          invoice={createInvoiceMetadata()}
          isLoadingItems={true}
          onDownloadPdf={onDownloadPdf}
        />
      );

      expect(screen.getByTestId('invoice-preview')).toHaveAttribute('data-loading-items', 'true');
    });

    it('passes isLoadingPayments to InvoicePreview', () => {
      render(
        <InvoicePreviewPanel
          invoice={createInvoiceMetadata()}
          isLoadingPayments={true}
          onDownloadPdf={onDownloadPdf}
        />
      );

      expect(screen.getByTestId('invoice-preview')).toHaveAttribute(
        'data-loading-payments',
        'true'
      );
    });
  });

  // -- Empty/null state -----------------------------------------------------

  describe('rendering with no optional props', () => {
    it('renders without items or payments', () => {
      render(
        <InvoicePreviewPanel invoice={createInvoiceMetadata()} onDownloadPdf={onDownloadPdf} />
      );

      expect(screen.getByTestId('invoice-preview')).toHaveAttribute('data-item-count', '0');
      expect(screen.getByTestId('invoice-preview')).toHaveAttribute('data-payment-count', '0');
    });
  });

  // -- Interaction ----------------------------------------------------------

  describe('download interaction', () => {
    it('calls onDownloadPdf when the download button is clicked', () => {
      render(
        <InvoicePreviewPanel invoice={createInvoiceMetadata()} onDownloadPdf={onDownloadPdf} />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));

      expect(onDownloadPdf).toHaveBeenCalledTimes(1);
    });
  });
});
