// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

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

const { MockCustomerForm } = vi.hoisted(() => ({
  MockCustomerForm: vi.fn(
    (_props: { onCreate?: (data: CreateCustomerInput) => void; isCreating?: boolean }) => null
  )
}));

vi.mock('@/features/crm/customers/components/customer-form', () => ({
  CustomerForm: MockCustomerForm
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({
    open,
    children
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
  }) => (open ? <div role='dialog'>{children}</div> : null),
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>
}));

// -- Helpers ----------------------------------------------------------------

function lastFormProps() {
  const calls = MockCustomerForm.mock.calls;
  return calls[calls.length - 1][0];
}

// -- Tests ------------------------------------------------------------------

describe('CreateCustomerDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCreateCustomer.mockReturnValue({ mutate: mockMutate, isPending: false });
    MockCustomerForm.mockImplementation(() => null);
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
      expect(MockCustomerForm).toHaveBeenCalled();
    });

    it('passes isPending as isCreating to CustomerForm', () => {
      mockUseCreateCustomer.mockReturnValueOnce({ mutate: mockMutate, isPending: true });
      render(<CreateCustomerDialog open={true} onOpenChange={vi.fn()} />);
      expect(lastFormProps().isCreating).toBe(true);
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

      const formData = { firstName: 'Jane' } as CreateCustomerInput;
      lastFormProps().onCreate(formData);

      expect(mockMutate).toHaveBeenCalledWith(formData, expect.any(Object));
    });

    it('calls onOpenChange(false) on successful creation', () => {
      const onOpenChange = vi.fn();
      mockMutate.mockImplementation(
        (_data: unknown, { onSuccess }: { onSuccess: (r: { id: string }) => void }) => {
          onSuccess({ id: 'new-cust' });
        }
      );

      render(<CreateCustomerDialog open={true} onOpenChange={onOpenChange} />);
      lastFormProps().onCreate({ firstName: 'Jane' } as CreateCustomerInput);

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
      lastFormProps().onCreate({ firstName: 'Jane' } as CreateCustomerInput);

      expect(onCreate).toHaveBeenCalledWith('new-cust-42');
    });
  });
});
