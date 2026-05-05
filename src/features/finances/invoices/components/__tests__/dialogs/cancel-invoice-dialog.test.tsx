// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { CancelInvoiceDialog } from '../../dialogs/cancel-invoice-dialog';

// -- Helpers ----------------------------------------------------------------

const INVOICE_ID = 'clxxxxxxxxxxxxxxxxxxxxxxx1';
const INVOICE_NUMBER = 'INV-001';

function makeProps(overrides: Partial<React.ComponentProps<typeof CancelInvoiceDialog>> = {}) {
  return {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    invoiceId: INVOICE_ID,
    ...overrides
  };
}

// -- Tests ------------------------------------------------------------------

describe('CancelInvoiceDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Rendering -------------------------------------------------------------

  describe('rendering', () => {
    it('renders dialog title when open', () => {
      render(<CancelInvoiceDialog {...makeProps()} />);

      expect(screen.getByRole('heading', { name: 'Cancel Invoice' })).toBeInTheDocument();
    });

    it('renders generic description when no invoiceNumber is provided', () => {
      render(<CancelInvoiceDialog {...makeProps()} />);

      expect(
        screen.getByText(/Enter the cancellation details below\. This action cannot be undone\./i)
      ).toBeInTheDocument();
    });

    it('renders invoice-specific description when invoiceNumber is provided', () => {
      render(<CancelInvoiceDialog {...makeProps({ invoiceNumber: INVOICE_NUMBER })} />);

      expect(
        screen.getByText(`Cancel invoice ${INVOICE_NUMBER}. This action cannot be undone.`)
      ).toBeInTheDocument();
    });

    it('renders the cancellation reason textarea', () => {
      render(<CancelInvoiceDialog {...makeProps()} />);

      expect(screen.getByLabelText(/Cancellation Reason/i)).toBeInTheDocument();
    });

    it('renders Go Back and Cancel Invoice buttons', () => {
      render(<CancelInvoiceDialog {...makeProps()} />);

      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel invoice/i })).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<CancelInvoiceDialog {...makeProps({ open: false })} />);

      expect(screen.queryByRole('heading', { name: 'Cancel Invoice' })).not.toBeInTheDocument();
    });
  });

  // -- Loading state ---------------------------------------------------------

  describe('loading state', () => {
    it('disables both buttons when isPending is true', () => {
      render(<CancelInvoiceDialog {...makeProps({ isPending: true })} />);

      expect(screen.getByRole('button', { name: /go back/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /cancelling\.\.\./i })).toBeDisabled();
    });

    it('shows Cancelling... label on submit button when isPending', () => {
      render(<CancelInvoiceDialog {...makeProps({ isPending: true })} />);

      expect(screen.getByRole('button', { name: /cancelling\.\.\./i })).toBeInTheDocument();
    });
  });

  // -- Interactions ----------------------------------------------------------

  describe('interactions', () => {
    it('calls onOpenChange(false) when Go Back is clicked', () => {
      const onOpenChange = vi.fn();
      render(<CancelInvoiceDialog {...makeProps({ onOpenChange })} />);

      fireEvent.click(screen.getByRole('button', { name: /go back/i }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('calls onConfirm with form data when submitted with a valid reason', async () => {
      const onConfirm = vi.fn();
      render(<CancelInvoiceDialog {...makeProps({ onConfirm })} />);

      fireEvent.change(screen.getByLabelText(/Cancellation Reason/i), {
        target: { value: 'Client request' }
      });
      fireEvent.click(screen.getByRole('button', { name: /cancel invoice/i }));

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledWith(
          expect.objectContaining({ id: INVOICE_ID, cancelReason: 'Client request' })
        );
      });
    });

    it('does not call onConfirm when submitted without a reason', async () => {
      const onConfirm = vi.fn();
      render(<CancelInvoiceDialog {...makeProps({ onConfirm })} />);

      fireEvent.click(screen.getByRole('button', { name: /cancel invoice/i }));

      await waitFor(() => {
        expect(onConfirm).not.toHaveBeenCalled();
      });
    });

    it('shows character count as reason is typed', () => {
      render(<CancelInvoiceDialog {...makeProps()} />);

      fireEvent.change(screen.getByLabelText(/Cancellation Reason/i), {
        target: { value: 'Hello' }
      });

      expect(screen.getByText('5/500 characters')).toBeInTheDocument();
    });
  });
});
