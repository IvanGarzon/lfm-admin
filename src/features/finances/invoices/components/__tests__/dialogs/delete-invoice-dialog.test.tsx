// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { DeleteInvoiceDialog } from '../../dialogs/delete-invoice-dialog';

// -- Helpers ----------------------------------------------------------------

function makeProps(overrides: Partial<React.ComponentProps<typeof DeleteInvoiceDialog>> = {}) {
  return {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    ...overrides
  };
}

// -- Tests ------------------------------------------------------------------

describe('DeleteInvoiceDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Rendering -------------------------------------------------------------

  describe('rendering', () => {
    it('renders dialog title when open', () => {
      render(<DeleteInvoiceDialog {...makeProps()} />);

      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    });

    it('renders generic description when no invoiceNumber is provided', () => {
      render(<DeleteInvoiceDialog {...makeProps()} />);

      expect(
        screen.getByText('This action cannot be undone. This will permanently delete the invoice.')
      ).toBeInTheDocument();
    });

    it('renders invoice-specific description when invoiceNumber is provided', () => {
      render(<DeleteInvoiceDialog {...makeProps({ invoiceNumber: 'INV-042' })} />);

      expect(
        screen.getByText(
          'This will permanently delete invoice INV-042. This action cannot be undone.'
        )
      ).toBeInTheDocument();
    });

    it('renders Cancel and Delete buttons', () => {
      render(<DeleteInvoiceDialog {...makeProps()} />);

      expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<DeleteInvoiceDialog {...makeProps({ open: false })} />);

      expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument();
    });
  });

  // -- Loading state ---------------------------------------------------------

  describe('loading state', () => {
    it('disables both buttons when isPending is true', () => {
      render(<DeleteInvoiceDialog {...makeProps({ isPending: true })} />);

      expect(screen.getByRole('button', { name: /^cancel$/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /deleting\.\.\./i })).toBeDisabled();
    });

    it('shows Deleting... label on confirm button when isPending', () => {
      render(<DeleteInvoiceDialog {...makeProps({ isPending: true })} />);

      expect(screen.getByRole('button', { name: /deleting\.\.\./i })).toBeInTheDocument();
    });
  });

  // -- Interactions ----------------------------------------------------------

  describe('interactions', () => {
    it('calls onConfirm when Delete button is clicked', () => {
      const onConfirm = vi.fn();
      render(<DeleteInvoiceDialog {...makeProps({ onConfirm })} />);

      fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('does not call onConfirm when Cancel is clicked', () => {
      const onConfirm = vi.fn();
      render(<DeleteInvoiceDialog {...makeProps({ onConfirm })} />);

      fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

      expect(onConfirm).not.toHaveBeenCalled();
    });
  });
});
