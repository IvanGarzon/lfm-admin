// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VendorForm } from '../vendor-form';
import { createVendorWithDetails } from '@/lib/testing/factories/vendor.factory';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/hooks/use-unsaved-changes', () => ({
  useUnsavedChanges: () => undefined
}));

vi.mock('@/hooks/use-form-reset', () => ({
  useFormReset: () => undefined
}));

vi.mock('@/components/ui/address-autocomplete/address-inline-fields', () => ({
  AddressInlineFields: () => <div data-testid='address-inline-fields' />
}));

// -- Helpers ----------------------------------------------------------------

function fillField(placeholder: string, value: string) {
  fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });
}

function submitWithValidData() {
  fillField('Acme Corp', 'Test Vendor');
  fillField('contact@acme.com', 'vendor@example.com');
  fireEvent.click(screen.getByRole('button', { name: 'Create Vendor' }));
}

// -- Tests ------------------------------------------------------------------

describe('VendorForm', () => {
  // -- Create mode ----------------------------------------------------------

  describe('create mode (no vendor prop)', () => {
    it('renders "Create Vendor" submit button', () => {
      render(<VendorForm />);
      expect(screen.getByRole('button', { name: 'Create Vendor' })).toBeInTheDocument();
    });

    it('renders section headings', () => {
      render(<VendorForm />);
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByText('Address')).toBeInTheDocument();
      expect(screen.getByText('Additional Information')).toBeInTheDocument();
    });

    it('renders address field', () => {
      render(<VendorForm />);
      expect(screen.getByTestId('address-inline-fields')).toBeInTheDocument();
    });

    it('calls onCreate with correct data on valid submission', async () => {
      const onCreate = vi.fn();
      render(<VendorForm onCreate={onCreate} />);

      fillField('Acme Corp', 'Test Vendor');
      fillField('contact@acme.com', 'vendor@example.com');
      fireEvent.click(screen.getByRole('button', { name: 'Create Vendor' }));

      await waitFor(() => {
        expect(onCreate).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Test Vendor', email: 'vendor@example.com' })
        );
      });
    });

    it('does not call onCreate when required fields are missing', async () => {
      const onCreate = vi.fn();
      render(<VendorForm onCreate={onCreate} />);

      fireEvent.click(screen.getByRole('button', { name: 'Create Vendor' }));

      await waitFor(() => {
        expect(onCreate).not.toHaveBeenCalled();
      });
    });
  });

  // -- Edit mode ------------------------------------------------------------

  describe('edit mode (with vendor prop)', () => {
    const vendor = createVendorWithDetails({ name: 'Bloom Co', email: 'bloom@co.com' });

    it('renders "Update Vendor" submit button', () => {
      render(<VendorForm vendor={vendor} />);
      expect(screen.getByRole('button', { name: 'Update Vendor' })).toBeInTheDocument();
    });

    it('pre-populates name field', () => {
      render(<VendorForm vendor={vendor} />);
      expect(screen.getByDisplayValue('Bloom Co')).toBeInTheDocument();
    });

    it('pre-populates email field', () => {
      render(<VendorForm vendor={vendor} />);
      expect(screen.getByDisplayValue('bloom@co.com')).toBeInTheDocument();
    });

    it('calls onUpdate with correct data on submission', async () => {
      const onUpdate = vi.fn();
      render(<VendorForm vendor={vendor} onUpdate={onUpdate} />);

      fireEvent.click(screen.getByRole('button', { name: 'Update Vendor' }));

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ id: vendor.id, name: 'Bloom Co', email: 'bloom@co.com' })
        );
      });
    });
  });

  // -- isCreating state -----------------------------------------------------

  describe('isCreating state', () => {
    it('shows "Creating vendor..." banner', () => {
      render(<VendorForm isCreating={true} />);
      expect(screen.getByText('Creating vendor...')).toBeInTheDocument();
    });

    it('submit button shows "Creating..."', () => {
      render(<VendorForm isCreating={true} />);
      expect(screen.getByRole('button', { name: /creating\.\.\./i })).toBeInTheDocument();
    });

    it('disables submit button', () => {
      render(<VendorForm isCreating={true} />);
      expect(screen.getByRole('button', { name: /creating\.\.\./i })).toBeDisabled();
    });
  });

  // -- isUpdating state -----------------------------------------------------

  describe('isUpdating state', () => {
    const vendor = createVendorWithDetails();

    it('shows "Updating vendor..." banner', () => {
      render(<VendorForm vendor={vendor} isUpdating={true} />);
      expect(screen.getByText('Updating vendor...')).toBeInTheDocument();
    });

    it('submit button shows "Updating..."', () => {
      render(<VendorForm vendor={vendor} isUpdating={true} />);
      expect(screen.getByRole('button', { name: /updating\.\.\./i })).toBeInTheDocument();
    });

    it('disables submit button', () => {
      render(<VendorForm vendor={vendor} isUpdating={true} />);
      expect(screen.getByRole('button', { name: /updating\.\.\./i })).toBeDisabled();
    });
  });

  // -- onClose prop ---------------------------------------------------------

  describe('onClose prop', () => {
    it('renders Cancel button when onClose is provided', () => {
      render(<VendorForm onClose={vi.fn()} />);
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('does not render Cancel button without onClose', () => {
      render(<VendorForm />);
      expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    });

    it('calls onClose when Cancel is clicked', () => {
      const onClose = vi.fn();
      render(<VendorForm onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('disables Cancel button when submitting', () => {
      render(<VendorForm onClose={vi.fn()} isCreating={true} />);
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });
  });
});
