// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { InvoiceDrawerHeader } from '../invoice-drawer-header';
import { createInvoiceDetails } from '@/lib/testing/factories/invoice.factory';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/components/ui/drawer', () => ({
  DrawerTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DrawerDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock('@/features/finances/invoices/components/invoice-status-badge', () => ({
  InvoiceStatusBadge: ({ status }: { status: string }) => (
    <span data-testid='status-badge' data-status={status} />
  )
}));

vi.mock('@/features/finances/invoices/components/invoice-drawer-actions-menu', () => ({
  InvoiceDrawerActionsMenu: () => <div data-testid='actions-menu' />
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

const baseProps = {
  title: 'Invoice INV-001',
  hasUnsavedChanges: false,
  showPreview: false,
  isCreating: false,
  isUpdating: false,
  onTogglePreview: vi.fn(),
  onClose: vi.fn()
};

// -- Tests ------------------------------------------------------------------

describe('InvoiceDrawerHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Create mode ----------------------------------------------------------

  describe('create mode', () => {
    it('renders the title', () => {
      render(<InvoiceDrawerHeader {...baseProps} mode='create' status={null} />);

      expect(screen.getByText('Invoice INV-001')).toBeInTheDocument();
    });

    it('renders Save as Draft button', () => {
      render(<InvoiceDrawerHeader {...baseProps} mode='create' status={null} />);

      expect(screen.getByRole('button', { name: /save as draft/i })).toBeInTheDocument();
    });

    it('disables Save as Draft button when isCreating is true', () => {
      render(<InvoiceDrawerHeader {...baseProps} mode='create' status={null} isCreating={true} />);

      expect(screen.getByRole('button', { name: /save as draft/i })).toBeDisabled();
    });

    it('does not render Show Preview button in create mode', () => {
      render(<InvoiceDrawerHeader {...baseProps} mode='create' status={null} />);

      expect(screen.queryByRole('button', { name: /preview/i })).not.toBeInTheDocument();
    });

    it('does not render actions menu in create mode', () => {
      render(<InvoiceDrawerHeader {...baseProps} mode='create' status={null} />);

      expect(screen.queryByTestId('actions-menu')).not.toBeInTheDocument();
    });
  });

  // -- Edit mode ------------------------------------------------------------

  describe('edit mode', () => {
    const invoice = createInvoiceDetails({ status: 'PENDING' });

    it('renders Show Preview button', () => {
      render(<InvoiceDrawerHeader {...baseProps} mode='edit' status='PENDING' invoice={invoice} />);

      expect(screen.getByRole('button', { name: /show preview/i })).toBeInTheDocument();
    });

    it('renders Hide Preview button when showPreview is true', () => {
      render(
        <InvoiceDrawerHeader
          {...baseProps}
          mode='edit'
          status='PENDING'
          invoice={invoice}
          showPreview={true}
        />
      );

      expect(screen.getByRole('button', { name: /hide preview/i })).toBeInTheDocument();
    });

    it('calls onTogglePreview when preview button is clicked', () => {
      const onTogglePreview = vi.fn();

      render(
        <InvoiceDrawerHeader
          {...baseProps}
          mode='edit'
          status='PENDING'
          invoice={invoice}
          onTogglePreview={onTogglePreview}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /show preview/i }));

      expect(onTogglePreview).toHaveBeenCalledTimes(1);
    });

    it('renders Update button for non-PAID invoices', () => {
      render(
        <InvoiceDrawerHeader
          {...baseProps}
          mode='edit'
          status='PENDING'
          invoice={invoice}
          hasUnsavedChanges={true}
        />
      );

      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });

    it('disables Update button when there are no unsaved changes', () => {
      render(
        <InvoiceDrawerHeader
          {...baseProps}
          mode='edit'
          status='PENDING'
          invoice={invoice}
          hasUnsavedChanges={false}
        />
      );

      expect(screen.getByRole('button', { name: /update/i })).toBeDisabled();
    });

    it('does not render Update button for PAID invoices', () => {
      const paidInvoice = createInvoiceDetails({ status: 'PAID' });

      render(
        <InvoiceDrawerHeader
          {...baseProps}
          mode='edit'
          status='PAID'
          invoice={paidInvoice}
          hasUnsavedChanges={true}
        />
      );

      expect(screen.queryByRole('button', { name: /update/i })).not.toBeInTheDocument();
    });

    it('renders actions menu when actionsMenuHandlers are provided', () => {
      render(
        <InvoiceDrawerHeader
          {...baseProps}
          mode='edit'
          status='PENDING'
          invoice={invoice}
          actionsMenuHandlers={makeHandlers()}
        />
      );

      expect(screen.getByTestId('actions-menu')).toBeInTheDocument();
    });

    it('does not render actions menu when actionsMenuHandlers are not provided', () => {
      render(<InvoiceDrawerHeader {...baseProps} mode='edit' status='PENDING' invoice={invoice} />);

      expect(screen.queryByTestId('actions-menu')).not.toBeInTheDocument();
    });

    it('shows unsaved changes indicator when hasUnsavedChanges is true', () => {
      render(
        <InvoiceDrawerHeader
          {...baseProps}
          mode='edit'
          status='PENDING'
          invoice={invoice}
          hasUnsavedChanges={true}
        />
      );

      expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
    });

    it('does not show unsaved changes indicator when hasUnsavedChanges is false', () => {
      render(
        <InvoiceDrawerHeader
          {...baseProps}
          mode='edit'
          status='PENDING'
          invoice={invoice}
          hasUnsavedChanges={false}
        />
      );

      expect(screen.queryByText(/unsaved changes/i)).not.toBeInTheDocument();
    });

    it('renders status badge when status is provided', () => {
      render(<InvoiceDrawerHeader {...baseProps} mode='edit' status='PENDING' invoice={invoice} />);

      expect(screen.getByTestId('status-badge')).toHaveAttribute('data-status', 'PENDING');
    });
  });

  // -- Close button ---------------------------------------------------------

  describe('close button', () => {
    it('calls onClose when the close button is clicked', () => {
      const onClose = vi.fn();

      render(<InvoiceDrawerHeader {...baseProps} mode='create' status={null} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: /close/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
