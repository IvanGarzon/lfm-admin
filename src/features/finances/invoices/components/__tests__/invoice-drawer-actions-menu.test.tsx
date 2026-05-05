// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { InvoiceDrawerActionsMenu } from '../invoice-drawer-actions-menu';
import { createInvoiceMetadata } from '@/lib/testing/factories/invoice.factory';
import type { InvoiceMetadata } from '@/features/finances/invoices/types';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
    className
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
  }) => (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  )
}));

// -- Helpers ----------------------------------------------------------------

function makeHandlers() {
  return {
    onDuplicate: vi.fn(),
    onMarkAsPending: vi.fn(),
    onMarkAsDraft: vi.fn(),
    onRecordPayment: vi.fn(),
    onSendReminder: vi.fn(),
    onCancel: vi.fn(),
    onDownloadPdf: vi.fn(),
    onSendReceipt: vi.fn(),
    onDelete: vi.fn()
  };
}

function makeInvoice(status: InvoiceMetadata['status']): InvoiceMetadata {
  return createInvoiceMetadata({ status });
}

// -- Tests ------------------------------------------------------------------

describe('InvoiceDrawerActionsMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Common actions -------------------------------------------------------

  describe('common actions', () => {
    it('renders the trigger button', () => {
      render(<InvoiceDrawerActionsMenu invoice={makeInvoice('DRAFT')} handlers={makeHandlers()} />);

      expect(screen.getByRole('button', { name: /more options/i })).toBeInTheDocument();
    });

    it('disables the trigger when isDisabled is true', () => {
      render(
        <InvoiceDrawerActionsMenu
          invoice={makeInvoice('DRAFT')}
          handlers={makeHandlers()}
          isDisabled={true}
        />
      );

      expect(screen.getByRole('button', { name: /more options/i })).toBeDisabled();
    });

    it('renders Duplicate invoice option', () => {
      render(<InvoiceDrawerActionsMenu invoice={makeInvoice('DRAFT')} handlers={makeHandlers()} />);

      expect(screen.getByText('Duplicate invoice')).toBeInTheDocument();
    });

    it('calls onDuplicate when Duplicate invoice is clicked', () => {
      const handlers = makeHandlers();
      render(<InvoiceDrawerActionsMenu invoice={makeInvoice('DRAFT')} handlers={handlers} />);

      fireEvent.click(screen.getByText('Duplicate invoice'));

      expect(handlers.onDuplicate).toHaveBeenCalledTimes(1);
    });
  });

  // -- Draft status ---------------------------------------------------------

  describe('DRAFT invoice', () => {
    it('renders Mark as pending option', () => {
      render(<InvoiceDrawerActionsMenu invoice={makeInvoice('DRAFT')} handlers={makeHandlers()} />);

      expect(screen.getByText('Mark as pending')).toBeInTheDocument();
    });

    it('calls onMarkAsPending when Mark as pending is clicked', () => {
      const handlers = makeHandlers();
      render(<InvoiceDrawerActionsMenu invoice={makeInvoice('DRAFT')} handlers={handlers} />);

      fireEvent.click(screen.getByText('Mark as pending'));

      expect(handlers.onMarkAsPending).toHaveBeenCalledTimes(1);
    });

    it('renders Delete invoice option', () => {
      render(<InvoiceDrawerActionsMenu invoice={makeInvoice('DRAFT')} handlers={makeHandlers()} />);

      expect(screen.getByText('Delete invoice')).toBeInTheDocument();
    });

    it('calls onDelete when Delete invoice is clicked', () => {
      const handlers = makeHandlers();
      render(<InvoiceDrawerActionsMenu invoice={makeInvoice('DRAFT')} handlers={handlers} />);

      fireEvent.click(screen.getByText('Delete invoice'));

      expect(handlers.onDelete).toHaveBeenCalledTimes(1);
    });

    it('does not render Revert to draft option', () => {
      render(<InvoiceDrawerActionsMenu invoice={makeInvoice('DRAFT')} handlers={makeHandlers()} />);

      expect(screen.queryByText('Revert to draft')).not.toBeInTheDocument();
    });
  });

  // -- Pending status -------------------------------------------------------

  describe('PENDING invoice', () => {
    it('renders Revert to draft option', () => {
      render(
        <InvoiceDrawerActionsMenu invoice={makeInvoice('PENDING')} handlers={makeHandlers()} />
      );

      expect(screen.getByText('Revert to draft')).toBeInTheDocument();
    });

    it('calls onMarkAsDraft when Revert to draft is clicked', () => {
      const handlers = makeHandlers();
      render(<InvoiceDrawerActionsMenu invoice={makeInvoice('PENDING')} handlers={handlers} />);

      fireEvent.click(screen.getByText('Revert to draft'));

      expect(handlers.onMarkAsDraft).toHaveBeenCalledTimes(1);
    });

    it('renders Record payment option', () => {
      render(
        <InvoiceDrawerActionsMenu invoice={makeInvoice('PENDING')} handlers={makeHandlers()} />
      );

      expect(screen.getByText('Record payment')).toBeInTheDocument();
    });

    it('calls onRecordPayment when Record payment is clicked', () => {
      const handlers = makeHandlers();
      render(<InvoiceDrawerActionsMenu invoice={makeInvoice('PENDING')} handlers={handlers} />);

      fireEvent.click(screen.getByText('Record payment'));

      expect(handlers.onRecordPayment).toHaveBeenCalledTimes(1);
    });

    it('renders Send reminder option', () => {
      render(
        <InvoiceDrawerActionsMenu invoice={makeInvoice('PENDING')} handlers={makeHandlers()} />
      );

      expect(screen.getByText('Send reminder')).toBeInTheDocument();
    });

    it('calls onSendReminder when Send reminder is clicked', () => {
      const handlers = makeHandlers();
      render(<InvoiceDrawerActionsMenu invoice={makeInvoice('PENDING')} handlers={handlers} />);

      fireEvent.click(screen.getByText('Send reminder'));

      expect(handlers.onSendReminder).toHaveBeenCalledTimes(1);
    });

    it('renders Cancel invoice option', () => {
      render(
        <InvoiceDrawerActionsMenu invoice={makeInvoice('PENDING')} handlers={makeHandlers()} />
      );

      expect(screen.getByText('Cancel invoice')).toBeInTheDocument();
    });

    it('calls onCancel when Cancel invoice is clicked', () => {
      const handlers = makeHandlers();
      render(<InvoiceDrawerActionsMenu invoice={makeInvoice('PENDING')} handlers={handlers} />);

      fireEvent.click(screen.getByText('Cancel invoice'));

      expect(handlers.onCancel).toHaveBeenCalledTimes(1);
    });
  });

  // -- Paid status ----------------------------------------------------------

  describe('PAID invoice', () => {
    it('renders Download invoice option', () => {
      render(<InvoiceDrawerActionsMenu invoice={makeInvoice('PAID')} handlers={makeHandlers()} />);

      expect(screen.getByText('Download invoice')).toBeInTheDocument();
    });

    it('calls onDownloadPdf when Download invoice is clicked', () => {
      const handlers = makeHandlers();
      render(<InvoiceDrawerActionsMenu invoice={makeInvoice('PAID')} handlers={handlers} />);

      fireEvent.click(screen.getByText('Download invoice'));

      expect(handlers.onDownloadPdf).toHaveBeenCalledTimes(1);
    });

    it('renders Send receipt option', () => {
      render(<InvoiceDrawerActionsMenu invoice={makeInvoice('PAID')} handlers={makeHandlers()} />);

      expect(screen.getByText('Send receipt')).toBeInTheDocument();
    });

    it('calls onSendReceipt when Send receipt is clicked', () => {
      const handlers = makeHandlers();
      render(<InvoiceDrawerActionsMenu invoice={makeInvoice('PAID')} handlers={handlers} />);

      fireEvent.click(screen.getByText('Send receipt'));

      expect(handlers.onSendReceipt).toHaveBeenCalledTimes(1);
    });

    it('does not render Delete invoice option', () => {
      render(<InvoiceDrawerActionsMenu invoice={makeInvoice('PAID')} handlers={makeHandlers()} />);

      expect(screen.queryByText('Delete invoice')).not.toBeInTheDocument();
    });
  });

  // -- Overdue status -------------------------------------------------------

  describe('OVERDUE invoice', () => {
    it('renders Record payment, Send reminder, and Cancel invoice options', () => {
      render(
        <InvoiceDrawerActionsMenu invoice={makeInvoice('OVERDUE')} handlers={makeHandlers()} />
      );

      expect(screen.getByText('Record payment')).toBeInTheDocument();
      expect(screen.getByText('Send reminder')).toBeInTheDocument();
      expect(screen.getByText('Cancel invoice')).toBeInTheDocument();
    });
  });
});
