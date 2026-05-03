// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { CustomerForm } from '../customer-form';
import type { CustomerListItem } from '@/features/crm/customers/types';

// -- Mocks ------------------------------------------------------------------

// Bypass Zod validation so tests can submit without filling all required fields.
vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => async (values: Record<string, unknown>) => ({ values, errors: {} })
}));

vi.mock('@/features/crm/organizations/hooks/use-organization-queries', () => ({
  useOrganizations: () => ({ data: [], isLoading: false })
}));

vi.mock('@/hooks/use-unsaved-changes', () => ({
  useUnsavedChanges: vi.fn()
}));

vi.mock('@/hooks/use-form-reset', () => ({
  useFormReset: vi.fn()
}));

vi.mock('@/components/ui/address-autocomplete/address-inline-fields', () => ({
  AddressInlineFields: () => null
}));

vi.mock('@/components/shared/organization-select', () => ({
  OrganizationSelect: () => null
}));

vi.mock('@/features/crm/customers/components/address-source-selector', () => ({
  AddressSourceSelector: () => null
}));

// -- Helpers ----------------------------------------------------------------

function getForm() {
  const form = document.getElementById('form-rhf-customer');
  if (!form) throw new Error('Form element not found');
  return form;
}

function getSubmitButton() {
  const btn = document.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!btn) throw new Error('Submit button not found');
  return btn;
}

function makeCustomer(overrides: Partial<CustomerListItem> = {}): CustomerListItem {
  return {
    id: 'customer-1',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: null,
    gender: 'FEMALE',
    status: 'ACTIVE',
    organizationId: null,
    organizationName: null,
    useOrganizationAddress: false,
    address: null,
    createdAt: new Date('2024-01-01'),
    deletedAt: null,
    invoicesCount: 3,
    quotesCount: 1,
    ...overrides
  };
}

// -- Tests ------------------------------------------------------------------

describe('CustomerForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Create mode -----------------------------------------------------------

  describe('create mode', () => {
    it('renders the "Create Customer" submit button', () => {
      render(<CustomerForm />);
      expect(screen.getByRole('button', { name: 'Create Customer' })).toBeInTheDocument();
    });

    it('does not show a loading banner by default', () => {
      render(<CustomerForm />);
      expect(screen.queryByText('Creating customer...')).not.toBeInTheDocument();
    });

    it('renders a Cancel button when onClose is provided', () => {
      render(<CustomerForm onClose={vi.fn()} />);
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('does not render a Cancel button without onClose', () => {
      render(<CustomerForm />);
      expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    });

    it('calls onClose when Cancel is clicked', () => {
      const onClose = vi.fn();
      render(<CustomerForm onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onCreate on form submit', async () => {
      const onCreate = vi.fn();
      render(<CustomerForm onCreate={onCreate} />);
      fireEvent.submit(getForm());
      await waitFor(() => {
        expect(onCreate).toHaveBeenCalledOnce();
      });
    });
  });

  // -- Update mode -----------------------------------------------------------

  describe('update mode', () => {
    it('renders the "Update Customer" submit button', () => {
      render(<CustomerForm customer={makeCustomer()} />);
      expect(screen.getByRole('button', { name: 'Update Customer' })).toBeInTheDocument();
    });

    it('disables the submit button when the form is not dirty', () => {
      render(<CustomerForm customer={makeCustomer()} />);
      expect(getSubmitButton()).toBeDisabled();
    });

    it('calls onUpdate with the customer id on submit', async () => {
      const onUpdate = vi.fn();
      render(<CustomerForm customer={makeCustomer({ id: 'cust-xyz' })} onUpdate={onUpdate} />);
      fireEvent.submit(getForm());
      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: 'cust-xyz' }));
      });
    });
  });

  // -- Loading states --------------------------------------------------------

  describe('loading states', () => {
    it('shows "Creating customer..." banner when isCreating', () => {
      render(<CustomerForm isCreating />);
      expect(screen.getByText('Creating customer...')).toBeInTheDocument();
    });

    it('shows "Updating customer..." banner when isUpdating', () => {
      render(<CustomerForm customer={makeCustomer()} isUpdating />);
      expect(screen.getByText('Updating customer...')).toBeInTheDocument();
    });

    it('disables the submit button when isCreating', () => {
      render(<CustomerForm isCreating />);
      expect(getSubmitButton()).toBeDisabled();
    });

    it('disables the submit button when isUpdating', () => {
      render(<CustomerForm customer={makeCustomer()} isUpdating />);
      expect(getSubmitButton()).toBeDisabled();
    });

    it('disables the Cancel button when isCreating', () => {
      render(<CustomerForm isCreating onClose={vi.fn()} />);
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });
  });
});
