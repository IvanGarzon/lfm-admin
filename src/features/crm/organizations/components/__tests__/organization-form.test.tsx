// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { OrganizationForm } from '../organization-form';
import { createOrganizationResponse } from '@/lib/testing/factories/organization.factory';
import { testIds } from '@/lib/testing/id-generator';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/components/ui/address-autocomplete/address-inline-fields', () => ({
  AddressInlineFields: () => <div data-testid='address-inline-fields' />
}));

vi.mock('@/hooks/use-unsaved-changes', () => ({
  useUnsavedChanges: vi.fn()
}));

// -- Tests ------------------------------------------------------------------

describe('OrganizationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Create mode ----------------------------------------------------------

  describe('create mode', () => {
    it('renders the name field', () => {
      render(<OrganizationForm />);
      expect(screen.getByPlaceholderText(/enter organization name/i)).toBeInTheDocument();
    });

    it('renders "Create Organization" submit button', () => {
      render(<OrganizationForm />);
      expect(screen.getByRole('button', { name: /create organization/i })).toBeInTheDocument();
    });

    it('does not render Cancel button when onClose is not provided', () => {
      render(<OrganizationForm />);
      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });

    it('renders Cancel button when onClose is provided', () => {
      render(<OrganizationForm onClose={vi.fn()} />);
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('calls onClose when Cancel is clicked', () => {
      const onClose = vi.fn();
      render(<OrganizationForm onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onCreate with form data on valid submit', async () => {
      const onCreate = vi.fn();
      const { container } = render(<OrganizationForm onCreate={onCreate} />);
      fireEvent.change(screen.getByPlaceholderText(/enter organization name/i), {
        target: { value: 'New Org' }
      });
      fireEvent.submit(container.querySelector('form')!);
      await waitFor(() => expect(onCreate).toHaveBeenCalled());
      expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Org' }));
    });

    it('does not call onCreate when name is empty', async () => {
      const onCreate = vi.fn();
      const { container } = render(<OrganizationForm onCreate={onCreate} />);
      fireEvent.submit(container.querySelector('form')!);
      await waitFor(() => expect(screen.queryByText(/required/i)).toBeInTheDocument(), {
        timeout: 500
      }).catch(() => {});
      expect(onCreate).not.toHaveBeenCalled();
    });

    it('shows "Creating organization..." label while isCreating', () => {
      render(<OrganizationForm isCreating={true} />);
      expect(screen.getByText(/creating organization/i)).toBeInTheDocument();
    });

    it('disables submit button while isCreating', () => {
      render(<OrganizationForm isCreating={true} />);
      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
    });

    it('renders address fields', () => {
      render(<OrganizationForm />);
      expect(screen.getByTestId('address-inline-fields')).toBeInTheDocument();
    });
  });

  // -- Update mode ----------------------------------------------------------

  describe('update mode', () => {
    const org = createOrganizationResponse({
      id: testIds.organization(),
      name: 'Acme Florals',
      status: 'ACTIVE'
    });

    it('renders "Update Organization" submit button', () => {
      render(<OrganizationForm organization={org} />);
      expect(screen.getByRole('button', { name: /update organization/i })).toBeInTheDocument();
    });

    it('pre-fills the name field with existing value', () => {
      render(<OrganizationForm organization={org} />);
      expect(screen.getByDisplayValue('Acme Florals')).toBeInTheDocument();
    });

    it('calls onUpdate with form data on valid submit', async () => {
      const onUpdate = vi.fn();
      const { container } = render(<OrganizationForm organization={org} onUpdate={onUpdate} />);
      fireEvent.change(screen.getByPlaceholderText(/enter organization name/i), {
        target: { value: 'Updated Org' }
      });
      fireEvent.submit(container.querySelector('form')!);
      await waitFor(() => expect(onUpdate).toHaveBeenCalled());
      expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated Org' }));
    });

    it('shows "Updating organization..." label while isUpdating', () => {
      render(<OrganizationForm organization={org} isUpdating={true} />);
      expect(screen.getByText(/updating organization/i)).toBeInTheDocument();
    });

    it('disables submit button while isUpdating', () => {
      render(<OrganizationForm organization={org} isUpdating={true} />);
      expect(screen.getByRole('button', { name: /updating/i })).toBeDisabled();
    });
  });
});
