// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { MarkAsPendingDialog } from '../../dialogs/mark-as-pending-dialog';

// -- Helpers ----------------------------------------------------------------

function makeProps(overrides: Partial<React.ComponentProps<typeof MarkAsPendingDialog>> = {}) {
  return {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    ...overrides
  };
}

// -- Tests ------------------------------------------------------------------

describe('MarkAsPendingDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Rendering -------------------------------------------------------------

  describe('rendering', () => {
    it('renders dialog title when open', () => {
      render(<MarkAsPendingDialog {...makeProps()} />);

      expect(screen.getByText('Mark invoice as pending?')).toBeInTheDocument();
    });

    it('renders generic description when no invoiceNumber is provided', () => {
      render(<MarkAsPendingDialog {...makeProps()} />);

      expect(
        screen.getByText('This will mark the invoice as pending and make it active for payment.')
      ).toBeInTheDocument();
    });

    it('renders invoice-specific description when invoiceNumber is provided', () => {
      render(<MarkAsPendingDialog {...makeProps({ invoiceNumber: 'INV-007' })} />);

      expect(
        screen.getByText(
          'This will mark invoice INV-007 as pending and make it active for payment.'
        )
      ).toBeInTheDocument();
    });

    it('renders Cancel and Mark as Pending buttons', () => {
      render(<MarkAsPendingDialog {...makeProps()} />);

      expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /mark as pending/i })).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<MarkAsPendingDialog {...makeProps({ open: false })} />);

      expect(screen.queryByText('Mark invoice as pending?')).not.toBeInTheDocument();
    });
  });

  // -- Loading state ---------------------------------------------------------

  describe('loading state', () => {
    it('disables both buttons when isPending is true', () => {
      render(<MarkAsPendingDialog {...makeProps({ isPending: true })} />);

      expect(screen.getByRole('button', { name: /^cancel$/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /updating\.\.\./i })).toBeDisabled();
    });

    it('shows Updating... label on confirm button when isPending', () => {
      render(<MarkAsPendingDialog {...makeProps({ isPending: true })} />);

      expect(screen.getByRole('button', { name: /updating\.\.\./i })).toBeInTheDocument();
    });
  });

  // -- Interactions ----------------------------------------------------------

  describe('interactions', () => {
    it('calls onConfirm when Mark as Pending button is clicked', () => {
      const onConfirm = vi.fn();
      render(<MarkAsPendingDialog {...makeProps({ onConfirm })} />);

      fireEvent.click(screen.getByRole('button', { name: /mark as pending/i }));

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('does not call onConfirm when Cancel is clicked', () => {
      const onConfirm = vi.fn();
      render(<MarkAsPendingDialog {...makeProps({ onConfirm })} />);

      fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

      expect(onConfirm).not.toHaveBeenCalled();
    });
  });
});
