// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteTransactionDialog } from '../dialogs/delete-transaction-dialog';

// -- Tests ------------------------------------------------------------------

describe('DeleteTransactionDialog', () => {
  const onOpenChange = vi.fn();
  const onConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Visibility -----------------------------------------------------------

  it('does not render content when open is false', () => {
    render(
      <DeleteTransactionDialog open={false} onOpenChange={onOpenChange} onConfirm={onConfirm} />
    );
    expect(screen.queryByText('Delete Transaction')).not.toBeInTheDocument();
  });

  it('renders dialog content when open is true', () => {
    render(
      <DeleteTransactionDialog open={true} onOpenChange={onOpenChange} onConfirm={onConfirm} />
    );
    expect(screen.getByRole('heading', { name: /delete transaction/i })).toBeInTheDocument();
  });

  // -- Reference number -----------------------------------------------------

  it('shows the referenceNumber in bold when provided', () => {
    render(
      <DeleteTransactionDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        referenceNumber='TXN-001'
      />
    );
    expect(screen.getByText('TXN-001')).toBeInTheDocument();
  });

  it('shows generic fallback text when referenceNumber is not provided', () => {
    render(
      <DeleteTransactionDialog open={true} onOpenChange={onOpenChange} onConfirm={onConfirm} />
    );
    expect(screen.getByText(/this transaction/i)).toBeInTheDocument();
  });

  // -- Actions --------------------------------------------------------------

  it('calls onConfirm when Delete Transaction button is clicked', () => {
    render(
      <DeleteTransactionDialog open={true} onOpenChange={onOpenChange} onConfirm={onConfirm} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete Transaction' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onOpenChange(false) when Cancel is clicked', () => {
    render(
      <DeleteTransactionDialog open={true} onOpenChange={onOpenChange} onConfirm={onConfirm} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  // -- Pending state --------------------------------------------------------

  it('shows "Deleting..." on the confirm button when isPending', () => {
    render(
      <DeleteTransactionDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending
      />
    );
    expect(screen.getByRole('button', { name: 'Deleting...' })).toBeInTheDocument();
  });

  it('disables both buttons when isPending', () => {
    render(
      <DeleteTransactionDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending
      />
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Deleting...' })).toBeDisabled();
  });
});
