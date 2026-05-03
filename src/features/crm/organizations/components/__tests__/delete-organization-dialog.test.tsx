// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { DeleteOrganizationDialog } from '../delete-organization-dialog';

// -- Helpers ----------------------------------------------------------------

function renderDialog(props: Partial<Parameters<typeof DeleteOrganizationDialog>[0]> = {}) {
  const defaults = {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    organizationName: undefined,
    customersCount: 0,
    isPending: false
  };
  return render(<DeleteOrganizationDialog {...defaults} {...props} />);
}

// -- Tests ------------------------------------------------------------------

describe('DeleteOrganizationDialog', () => {
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

  // -- No linked customers (deletable) --------------------------------------

  describe('when no customers are linked', () => {
    it('shows "Are you sure?" heading', () => {
      renderDialog({ customersCount: 0 });
      expect(screen.getByRole('heading', { name: /are you sure/i })).toBeInTheDocument();
    });

    it('includes organisation name in description when provided', () => {
      renderDialog({ organizationName: 'Acme Florals', customersCount: 0 });
      expect(screen.getByText(/Acme Florals/)).toBeInTheDocument();
    });

    it('shows generic description when no organisation name provided', () => {
      renderDialog({ organizationName: undefined, customersCount: 0 });
      expect(screen.getByText(/permanently delete the organization/i)).toBeInTheDocument();
    });

    it('renders Delete button', () => {
      renderDialog({ customersCount: 0 });
      expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
    });

    it('renders Cancel button', () => {
      renderDialog({ customersCount: 0 });
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('calls onConfirm when Delete is clicked', () => {
      const onConfirm = vi.fn();
      renderDialog({ onConfirm, customersCount: 0 });
      fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
      expect(onConfirm).toHaveBeenCalledOnce();
    });

    it('does not call onConfirm when Cancel is clicked', () => {
      const onConfirm = vi.fn();
      renderDialog({ onConfirm, customersCount: 0 });
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  // -- Linked customers (blocked) -------------------------------------------

  describe('when customers are linked', () => {
    it('shows "Cannot delete organization" heading', () => {
      renderDialog({ customersCount: 2 });
      expect(
        screen.getByRole('heading', { name: /cannot delete organization/i })
      ).toBeInTheDocument();
    });

    it('shows singular "customer" when count is 1', () => {
      renderDialog({ customersCount: 1 });
      expect(screen.getByText(/1 customer linked/i)).toBeInTheDocument();
    });

    it('shows plural "customers" when count is greater than 1', () => {
      renderDialog({ customersCount: 3 });
      expect(screen.getByText(/3 customers linked/i)).toBeInTheDocument();
    });

    it('includes organisation name in description when provided', () => {
      renderDialog({ organizationName: 'Acme Florals', customersCount: 2 });
      expect(screen.getByText(/Acme Florals has 2 customers/)).toBeInTheDocument();
    });

    it('does not render a Delete button', () => {
      renderDialog({ customersCount: 2 });
      expect(screen.queryByRole('button', { name: /^delete$/i })).not.toBeInTheDocument();
    });

    it('renders a Close button instead of Cancel', () => {
      renderDialog({ customersCount: 2 });
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });
  });

  // -- Pending state --------------------------------------------------------

  describe('when isPending is true', () => {
    it('disables the Delete button', () => {
      renderDialog({ isPending: true, customersCount: 0 });
      expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled();
    });

    it('disables the Cancel button', () => {
      renderDialog({ isPending: true, customersCount: 0 });
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });

    it('shows "Deleting..." label on the action button', () => {
      renderDialog({ isPending: true, customersCount: 0 });
      expect(screen.getByRole('button', { name: /deleting/i })).toBeInTheDocument();
    });
  });
});
