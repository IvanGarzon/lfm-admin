// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { InvoiceActions } from '../invoice-actions';
import type { InvoiceListItem } from '@/features/finances/invoices/types';
import { createInvoiceListItem } from '@/lib/testing/factories/invoice.factory';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/hooks/use-query-string', () => ({
  useQueryString: () => ''
}));

vi.mock('@/filters/invoices/invoices-filters', () => ({
  searchParams: {},
  invoiceSearchParamsDefaults: {}
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  )
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
    asChild,
    className
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    asChild?: boolean;
    className?: string;
  }) =>
    asChild ? (
      <div className={className}>{children}</div>
    ) : (
      <button onClick={onClick} className={className}>
        {children}
      </button>
    ),
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />
}));

// -- Helpers ----------------------------------------------------------------

function makeCallbacks() {
  return {
    onDelete: vi.fn(),
    onSendReminder: vi.fn(),
    onMarkAsPending: vi.fn(),
    onRecordPayment: vi.fn(),
    onCancel: vi.fn(),
    onDownloadPdf: vi.fn(),
    onSendReceipt: vi.fn(),
    onDuplicate: vi.fn(),
    onMarkAsDraft: vi.fn()
  };
}

// -- Tests ------------------------------------------------------------------

describe('InvoiceActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Common actions -------------------------------------------------------

  describe('common actions', () => {
    it('renders the Download invoice button', () => {
      render(
        <InvoiceActions
          invoice={createInvoiceListItem({
            id: 'inv-1',
            invoiceNumber: 'INV-001',
            status: 'DRAFT'
          })}
          {...makeCallbacks()}
        />
      );

      expect(screen.getByRole('button', { name: /download invoice/i })).toBeInTheDocument();
    });

    it('calls onDownloadPdf when Download invoice button is clicked', () => {
      const callbacks = makeCallbacks();
      render(
        <InvoiceActions
          invoice={createInvoiceListItem({
            id: 'inv-1',
            invoiceNumber: 'INV-001',
            status: 'DRAFT'
          })}
          {...callbacks}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /download invoice/i }));

      expect(callbacks.onDownloadPdf).toHaveBeenCalledWith('inv-1');
    });

    it('renders View invoice link in the menu', () => {
      render(
        <InvoiceActions
          invoice={createInvoiceListItem({
            id: 'inv-1',
            invoiceNumber: 'INV-001',
            status: 'DRAFT'
          })}
          {...makeCallbacks()}
        />
      );

      expect(screen.getByRole('link', { name: /view invoice/i })).toBeInTheDocument();
    });

    it('View invoice link points to the invoice detail page', () => {
      render(
        <InvoiceActions
          invoice={createInvoiceListItem({
            id: 'inv-1',
            invoiceNumber: 'INV-001',
            status: 'DRAFT'
          })}
          {...makeCallbacks()}
        />
      );

      expect(screen.getByRole('link', { name: /view invoice/i })).toHaveAttribute(
        'href',
        '/finances/invoices/inv-1'
      );
    });

    it('renders Duplicate invoice option', () => {
      render(
        <InvoiceActions
          invoice={createInvoiceListItem({
            id: 'inv-1',
            invoiceNumber: 'INV-001',
            status: 'DRAFT'
          })}
          {...makeCallbacks()}
        />
      );

      expect(screen.getByText('Duplicate invoice')).toBeInTheDocument();
    });

    it('calls onDuplicate when Duplicate invoice is clicked', () => {
      const callbacks = makeCallbacks();
      render(
        <InvoiceActions
          invoice={createInvoiceListItem({
            id: 'inv-1',
            invoiceNumber: 'INV-001',
            status: 'DRAFT'
          })}
          {...callbacks}
        />
      );

      fireEvent.click(screen.getByText('Duplicate invoice'));

      expect(callbacks.onDuplicate).toHaveBeenCalledWith('inv-1');
    });
  });

  // -- Draft status ---------------------------------------------------------

  describe('DRAFT invoice', () => {
    it('renders Mark as pending option', () => {
      render(
        <InvoiceActions
          invoice={createInvoiceListItem({
            id: 'inv-1',
            invoiceNumber: 'INV-001',
            status: 'DRAFT'
          })}
          {...makeCallbacks()}
        />
      );

      expect(screen.getByText('Mark as pending')).toBeInTheDocument();
    });

    it('calls onMarkAsPending with id and invoiceNumber', () => {
      const callbacks = makeCallbacks();
      render(
        <InvoiceActions
          invoice={createInvoiceListItem({
            id: 'inv-1',
            invoiceNumber: 'INV-001',
            status: 'DRAFT'
          })}
          {...callbacks}
        />
      );

      fireEvent.click(screen.getByText('Mark as pending'));

      expect(callbacks.onMarkAsPending).toHaveBeenCalledWith('inv-1', 'INV-001');
    });

    it('renders Delete invoice option', () => {
      render(
        <InvoiceActions
          invoice={createInvoiceListItem({
            id: 'inv-1',
            invoiceNumber: 'INV-001',
            status: 'DRAFT'
          })}
          {...makeCallbacks()}
        />
      );

      expect(screen.getByText('Delete invoice')).toBeInTheDocument();
    });

    it('calls onDelete with id and invoiceNumber', () => {
      const callbacks = makeCallbacks();
      render(
        <InvoiceActions
          invoice={createInvoiceListItem({
            id: 'inv-1',
            invoiceNumber: 'INV-001',
            status: 'DRAFT'
          })}
          {...callbacks}
        />
      );

      fireEvent.click(screen.getByText('Delete invoice'));

      expect(callbacks.onDelete).toHaveBeenCalledWith('inv-1', 'INV-001');
    });

    it('does not render Record payment option', () => {
      render(
        <InvoiceActions
          invoice={createInvoiceListItem({
            id: 'inv-1',
            invoiceNumber: 'INV-001',
            status: 'DRAFT'
          })}
          {...makeCallbacks()}
        />
      );

      expect(screen.queryByText('Record payment')).not.toBeInTheDocument();
    });
  });

  // -- Pending status -------------------------------------------------------

  describe('PENDING invoice', () => {
    it('renders Record payment option', () => {
      render(
        <InvoiceActions
          invoice={createInvoiceListItem({
            id: 'inv-1',
            invoiceNumber: 'INV-001',
            status: 'PENDING'
          })}
          {...makeCallbacks()}
        />
      );

      expect(screen.getByText('Record payment')).toBeInTheDocument();
    });

    it('calls onRecordPayment with id and invoiceNumber', () => {
      const callbacks = makeCallbacks();
      render(
        <InvoiceActions
          invoice={createInvoiceListItem({
            id: 'inv-1',
            invoiceNumber: 'INV-001',
            status: 'PENDING'
          })}
          {...callbacks}
        />
      );

      fireEvent.click(screen.getByText('Record payment'));

      expect(callbacks.onRecordPayment).toHaveBeenCalledWith('inv-1', 'INV-001');
    });

    it('renders Send reminder option', () => {
      render(
        <InvoiceActions
          invoice={createInvoiceListItem({
            id: 'inv-1',
            invoiceNumber: 'INV-001',
            status: 'PENDING'
          })}
          {...makeCallbacks()}
        />
      );

      expect(screen.getByText('Send reminder')).toBeInTheDocument();
    });

    it('calls onSendReminder with the invoice id', () => {
      const callbacks = makeCallbacks();
      render(
        <InvoiceActions
          invoice={createInvoiceListItem({
            id: 'inv-1',
            invoiceNumber: 'INV-001',
            status: 'PENDING'
          })}
          {...callbacks}
        />
      );

      fireEvent.click(screen.getByText('Send reminder'));

      expect(callbacks.onSendReminder).toHaveBeenCalledWith('inv-1');
    });

    it('renders Revert to draft option', () => {
      render(
        <InvoiceActions
          invoice={createInvoiceListItem({
            id: 'inv-1',
            invoiceNumber: 'INV-001',
            status: 'PENDING'
          })}
          {...makeCallbacks()}
        />
      );

      expect(screen.getByText('Revert to draft')).toBeInTheDocument();
    });

    it('calls onMarkAsDraft when Revert to draft is clicked', () => {
      const callbacks = makeCallbacks();
      render(
        <InvoiceActions
          invoice={createInvoiceListItem({
            id: 'inv-1',
            invoiceNumber: 'INV-001',
            status: 'PENDING'
          })}
          {...callbacks}
        />
      );

      fireEvent.click(screen.getByText('Revert to draft'));

      expect(callbacks.onMarkAsDraft).toHaveBeenCalledWith('inv-1');
    });

    it('renders Cancel invoice option', () => {
      render(
        <InvoiceActions
          invoice={createInvoiceListItem({
            id: 'inv-1',
            invoiceNumber: 'INV-001',
            status: 'PENDING'
          })}
          {...makeCallbacks()}
        />
      );

      expect(screen.getByText('Cancel invoice')).toBeInTheDocument();
    });

    it('calls onCancel with id and invoiceNumber', () => {
      const callbacks = makeCallbacks();
      render(
        <InvoiceActions
          invoice={createInvoiceListItem({
            id: 'inv-1',
            invoiceNumber: 'INV-001',
            status: 'PENDING'
          })}
          {...callbacks}
        />
      );

      fireEvent.click(screen.getByText('Cancel invoice'));

      expect(callbacks.onCancel).toHaveBeenCalledWith('inv-1', 'INV-001');
    });

    it('does not render Delete invoice option', () => {
      render(
        <InvoiceActions
          invoice={createInvoiceListItem({
            id: 'inv-1',
            invoiceNumber: 'INV-001',
            status: 'PENDING'
          })}
          {...makeCallbacks()}
        />
      );

      expect(screen.queryByText('Delete invoice')).not.toBeInTheDocument();
    });
  });

  // -- Paid status ----------------------------------------------------------

  describe('PAID invoice', () => {
    it('renders Send receipt option when onSendReceipt is provided', () => {
      render(
        <InvoiceActions
          invoice={createInvoiceListItem({ id: 'inv-1', invoiceNumber: 'INV-001', status: 'PAID' })}
          {...makeCallbacks()}
        />
      );

      expect(screen.getByText('Send receipt')).toBeInTheDocument();
    });

    it('calls onSendReceipt with the invoice id', () => {
      const callbacks = makeCallbacks();
      render(
        <InvoiceActions
          invoice={createInvoiceListItem({ id: 'inv-1', invoiceNumber: 'INV-001', status: 'PAID' })}
          {...callbacks}
        />
      );

      fireEvent.click(screen.getByText('Send receipt'));

      expect(callbacks.onSendReceipt).toHaveBeenCalledWith('inv-1');
    });

    it('does not render Send receipt when onSendReceipt is not provided', () => {
      const { onSendReceipt: _unused, ...callbacksWithoutReceipt } = makeCallbacks();
      render(
        <InvoiceActions
          invoice={createInvoiceListItem({ id: 'inv-1', invoiceNumber: 'INV-001', status: 'PAID' })}
          {...callbacksWithoutReceipt}
        />
      );

      expect(screen.queryByText('Send receipt')).not.toBeInTheDocument();
    });

    it('does not render Record payment option', () => {
      render(
        <InvoiceActions
          invoice={createInvoiceListItem({ id: 'inv-1', invoiceNumber: 'INV-001', status: 'PAID' })}
          {...makeCallbacks()}
        />
      );

      expect(screen.queryByText('Record payment')).not.toBeInTheDocument();
    });
  });

  // -- Overdue status -------------------------------------------------------

  describe('OVERDUE invoice', () => {
    it('renders Record payment, Send reminder, and Cancel invoice options', () => {
      render(
        <InvoiceActions
          invoice={createInvoiceListItem({
            id: 'inv-1',
            invoiceNumber: 'INV-001',
            status: 'OVERDUE'
          })}
          {...makeCallbacks()}
        />
      );

      expect(screen.getByText('Record payment')).toBeInTheDocument();
      expect(screen.getByText('Send reminder')).toBeInTheDocument();
      expect(screen.getByText('Cancel invoice')).toBeInTheDocument();
    });

    it('does not render Revert to draft for overdue invoices', () => {
      render(
        <InvoiceActions
          invoice={createInvoiceListItem({
            id: 'inv-1',
            invoiceNumber: 'INV-001',
            status: 'OVERDUE'
          })}
          {...makeCallbacks()}
        />
      );

      expect(screen.queryByText('Revert to draft')).not.toBeInTheDocument();
    });
  });
});
