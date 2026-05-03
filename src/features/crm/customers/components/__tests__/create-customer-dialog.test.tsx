// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { CreateCustomerDialog } from '../create-customer-dialog';
import type { CreateCustomerInput } from '@/schemas/customers';

// -- Mocks ------------------------------------------------------------------

const { mockMutate, mockUseCreateCustomer } = vi.hoisted(() => {
  const mockMutate = vi.fn();
  const mockUseCreateCustomer = vi.fn(() => ({ mutate: mockMutate, isPending: false }));
  return { mockMutate, mockUseCreateCustomer };
});

vi.mock('@/features/crm/customers/hooks/use-customer-queries', () => ({
  useCreateCustomer: mockUseCreateCustomer
}));

vi.mock('@/features/crm/customers/components/customer-form', () => ({
  CustomerForm: ({
    onCreate,
    isCreating
  }: {
    onCreate?: (data: CreateCustomerInput) => void;
    isCreating?: boolean;
  }) => (
    <div data-testid='customer-form' data-creating={String(isCreating)}>
      <button onClick={() => onCreate?.({ firstName: 'Jane' } as CreateCustomerInput)}>
        Submit
      </button>
    </div>
  )
}));

// -- Tests ------------------------------------------------------------------

describe('CreateCustomerDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCreateCustomer.mockReturnValue({ mutate: mockMutate, isPending: false });
  });

  describe('when open', () => {
    it('renders the dialog', () => {
      render(<CreateCustomerDialog open={true} onOpenChange={vi.fn()} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('shows the "Add New Customer" title', () => {
      render(<CreateCustomerDialog open={true} onOpenChange={vi.fn()} />);
      expect(screen.getByRole('heading', { name: 'Add New Customer' })).toBeInTheDocument();
    });

    it('renders CustomerForm', () => {
      render(<CreateCustomerDialog open={true} onOpenChange={vi.fn()} />);
      expect(screen.getByTestId('customer-form')).toBeInTheDocument();
    });

    it('passes isPending as isCreating to CustomerForm', () => {
      mockUseCreateCustomer.mockReturnValueOnce({ mutate: mockMutate, isPending: true });
      render(<CreateCustomerDialog open={true} onOpenChange={vi.fn()} />);
      expect(screen.getByTestId('customer-form')).toHaveAttribute('data-creating', 'true');
    });
  });

  describe('when closed', () => {
    it('does not render the dialog', () => {
      render(<CreateCustomerDialog open={false} onOpenChange={vi.fn()} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('onCreate callback', () => {
    it('calls createCustomer.mutate with the form data', () => {
      render(<CreateCustomerDialog open={true} onOpenChange={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
      expect(mockMutate).toHaveBeenCalledWith({ firstName: 'Jane' }, expect.any(Object));
    });

    it('calls onOpenChange(false) on successful creation', () => {
      const onOpenChange = vi.fn();
      mockMutate.mockImplementation(
        (_data: unknown, { onSuccess }: { onSuccess: (r: { id: string }) => void }) => {
          onSuccess({ id: 'new-cust' });
        }
      );
      render(<CreateCustomerDialog open={true} onOpenChange={onOpenChange} />);
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('calls onCreate prop with the new customer id on success', () => {
      const onCreate = vi.fn();
      mockMutate.mockImplementation(
        (_data: unknown, { onSuccess }: { onSuccess: (r: { id: string }) => void }) => {
          onSuccess({ id: 'new-cust-42' });
        }
      );
      render(<CreateCustomerDialog open={true} onOpenChange={vi.fn()} onCreate={onCreate} />);
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
      expect(onCreate).toHaveBeenCalledWith('new-cust-42');
    });
  });
});
