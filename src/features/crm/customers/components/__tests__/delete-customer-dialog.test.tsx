// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { DeleteCustomerDialog } from '../delete-customer-dialog';

// -- Helpers ----------------------------------------------------------------

function renderDialog(props: Partial<Parameters<typeof DeleteCustomerDialog>[0]> = {}) {
  const defaults = {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    customerName: undefined,
    isPending: false
  };
  return render(<DeleteCustomerDialog {...defaults} {...props} />);
}

// -- Tests ------------------------------------------------------------------

describe('DeleteCustomerDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Visibility -----------------------------------------------------------

  it('renders when open is true', () => {
    renderDialog({ open: true });
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    renderDialog({ open: false });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  // -- Content --------------------------------------------------------------

  it('shows heading "Are you sure?"', () => {
    renderDialog();
    expect(screen.getByRole('heading', { name: /are you sure/i })).toBeInTheDocument();
  });

  it('includes customer name in description when provided', () => {
    renderDialog({ customerName: 'Jane Smith' });
    expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
  });

  it('shows generic description when no customer name provided', () => {
    renderDialog({ customerName: undefined });
    expect(screen.getByText(/permanently delete the customer/i)).toBeInTheDocument();
  });

  // -- Actions --------------------------------------------------------------

  it('calls onConfirm when Delete button is clicked', () => {
    const onConfirm = vi.fn();
    renderDialog({ onConfirm });
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('does not call onConfirm when Cancel is clicked', () => {
    const onConfirm = vi.fn();
    renderDialog({ onConfirm });
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  // -- Pending state --------------------------------------------------------

  it('disables Delete button while isPending', () => {
    renderDialog({ isPending: true });
    expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled();
  });

  it('disables Cancel button while isPending', () => {
    renderDialog({ isPending: true });
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('shows "Deleting..." label on Delete button while isPending', () => {
    renderDialog({ isPending: true });
    expect(screen.getByRole('button', { name: /deleting/i })).toBeInTheDocument();
  });
});
