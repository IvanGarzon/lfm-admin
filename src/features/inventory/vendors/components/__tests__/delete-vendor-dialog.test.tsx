// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteVendorDialog } from '../delete-vendor-dialog';

// -- Tests ------------------------------------------------------------------

describe('DeleteVendorDialog', () => {
  const onOpenChange = vi.fn();
  const onConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Visibility -----------------------------------------------------------

  it('does not render content when open is false', () => {
    render(
      <DeleteVendorDialog
        open={false}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={false}
      />
    );
    expect(screen.queryByText('Delete Vendor')).not.toBeInTheDocument();
  });

  it('renders dialog content when open is true', () => {
    render(
      <DeleteVendorDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={false}
      />
    );
    expect(screen.getByRole('heading', { name: /delete vendor/i })).toBeInTheDocument();
  });

  // -- Vendor info ----------------------------------------------------------

  it('shows vendorCode and vendorName when both are provided', () => {
    render(
      <DeleteVendorDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={false}
        vendorCode='VEN-001'
        vendorName='Acme Florals'
      />
    );
    expect(screen.getByText(/VEN-001/)).toBeInTheDocument();
    expect(screen.getByText(/Acme Florals/)).toBeInTheDocument();
  });

  it('falls back to "this vendor" when vendorName is not provided', () => {
    render(
      <DeleteVendorDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={false}
        vendorCode='VEN-001'
      />
    );
    expect(screen.getByText(/this vendor/i)).toBeInTheDocument();
  });

  // -- Actions --------------------------------------------------------------

  it('calls onConfirm when Delete button is clicked', () => {
    render(
      <DeleteVendorDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={false}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onOpenChange(false) when Cancel is clicked', () => {
    render(
      <DeleteVendorDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={false}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  // -- Pending state --------------------------------------------------------

  it('shows "Deleting..." on the confirm button when isPending', () => {
    render(
      <DeleteVendorDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={true}
      />
    );
    expect(screen.getByRole('button', { name: 'Deleting...' })).toBeInTheDocument();
  });

  it('disables Cancel button when isPending', () => {
    render(
      <DeleteVendorDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={true}
      />
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('disables confirm button when isPending', () => {
    render(
      <DeleteVendorDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={true}
      />
    );
    expect(screen.getByRole('button', { name: 'Deleting...' })).toBeDisabled();
  });
});
