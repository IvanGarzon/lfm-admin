// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

import { TransactionForm } from '../transaction-form';
import { createTransactionWithDetails } from '@/lib/testing';

// -- Mocks ----------------------------------------------------------------

// Allows testing form submission without filling in required fields
vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => async (values: Record<string, unknown>) => ({ values, errors: {} }),
}));

vi.mock('@/features/inventory/vendors/hooks/use-vendor-queries', () => ({
  useActiveVendors: () => ({
    data: [{ id: 'vendor-1', name: 'Acme Corp' }],
    isLoading: false,
  }),
}));

vi.mock('@/features/crm/customers/hooks/use-customer-queries', () => ({
  useActiveCustomers: () => ({
    data: [{ id: 'customer-1', firstName: 'Jane', lastName: 'Smith' }],
    isLoading: false,
  }),
}));

vi.mock('@/features/finances/transactions/hooks/use-transaction-queries', () => ({
  useTransactionCategories: () => ({ data: [], isLoading: false }),
}));

type PayeeFieldProps = {
  onVendorChange: (id: string) => void;
  onCustomerChange: (id: string) => void;
  transactionType: string;
  isDisabled: boolean;
};

type CategoryFieldProps = {
  onCategoryCreated: (category: unknown) => void;
  isDisabled: boolean;
};

const { mockInvalidateQueries, MockPayeeField, MockCategoryField } = vi.hoisted(() => ({
  mockInvalidateQueries: vi.fn(),
  MockPayeeField: vi.fn((_props: PayeeFieldProps) => null),
  MockCategoryField: vi.fn((_props: CategoryFieldProps) => null),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

vi.mock('@/hooks/use-unsaved-changes', () => ({
  useUnsavedChanges: vi.fn(),
}));

vi.mock('@/hooks/use-form-reset', () => ({
  useFormReset: vi.fn(),
}));

vi.mock('../transaction-attachments', () => ({
  TransactionAttachments: () => null,
}));

vi.mock('../form-fields/transaction-type-fields', () => ({
  TransactionTypeFields: () => null,
}));

vi.mock('../form-fields/transaction-category-field', () => ({
  TransactionCategoryField: MockCategoryField,
}));

vi.mock('../form-fields/transaction-payee-field', () => ({
  TransactionPayeeField: MockPayeeField,
}));

vi.mock('../form-fields/transaction-description-field', () => ({
  TransactionDescriptionField: () => null,
}));

vi.mock('../form-fields/transaction-date-status-fields', () => ({
  TransactionDateStatusFields: () => null,
}));

// -- Helpers --------------------------------------------------------------

function getForm() {
  const form = document.getElementById('form-rhf-transaction');
  if (!form) throw new Error('Form element not found');
  return form;
}

function getSubmitButton() {
  const btn = document.querySelector('button[type="submit"]');
  if (!btn) throw new Error('Submit button not found');
  return btn as HTMLButtonElement;
}

function lastPayeeFieldProps(): PayeeFieldProps {
  const calls = MockPayeeField.mock.calls;
  return calls[calls.length - 1][0];
}

function lastCategoryFieldProps(): CategoryFieldProps {
  const calls = MockCategoryField.mock.calls;
  return calls[calls.length - 1][0];
}

// -- Tests ----------------------------------------------------------------

describe('TransactionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockPayeeField.mockImplementation(() => null);
    MockCategoryField.mockImplementation(() => null);
  });

  describe('create mode', () => {
    it('renders the Create Transaction submit button', () => {
      render(<TransactionForm />);
      expect(screen.getByRole('button', { name: 'Create Transaction' })).toBeInTheDocument();
    });

    it('does not show a loading banner', () => {
      render(<TransactionForm />);
      expect(screen.queryByText('Creating transaction...')).not.toBeInTheDocument();
    });

    it('does not show a reference number section', () => {
      render(<TransactionForm />);
      expect(screen.queryByText(/reference number/i)).not.toBeInTheDocument();
    });

    it('renders a Cancel button when onClose is provided', () => {
      render(<TransactionForm onClose={vi.fn()} />);
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('does not render a Cancel button without onClose', () => {
      render(<TransactionForm />);
      expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    });

    it('calls onClose when Cancel is clicked', () => {
      const onClose = vi.fn();
      render(<TransactionForm onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onCreate when the form is submitted', async () => {
      const onCreate = vi.fn();
      render(<TransactionForm onCreate={onCreate} />);
      fireEvent.submit(getForm());
      await waitFor(() => {
        expect(onCreate).toHaveBeenCalledOnce();
      });
    });
  });

  describe('edit mode', () => {
    it('renders the Update Transaction submit button', () => {
      const transaction = createTransactionWithDetails();
      render(<TransactionForm transaction={transaction} />);
      expect(screen.getByRole('button', { name: 'Update Transaction' })).toBeInTheDocument();
    });

    it('shows the reference number when the transaction has one', () => {
      const transaction = createTransactionWithDetails({ referenceNumber: 'TXN-001' });
      render(<TransactionForm transaction={transaction} />);
      expect(screen.getByText('Reference Number')).toBeInTheDocument();
      expect(screen.getByText('TXN-001')).toBeInTheDocument();
    });

    it('hides the reference number section when referenceNumber is null', () => {
      const transaction = createTransactionWithDetails({ referenceNumber: null });
      render(<TransactionForm transaction={transaction} />);
      expect(screen.queryByText('Reference Number')).not.toBeInTheDocument();
    });

    it('disables the submit button when the form is not dirty', () => {
      const transaction = createTransactionWithDetails();
      render(<TransactionForm transaction={transaction} />);
      expect(getSubmitButton()).toBeDisabled();
    });

    it('calls onUpdate with the transaction id on submit', async () => {
      const onUpdate = vi.fn();
      const transaction = createTransactionWithDetails({ id: 'txn-abc' });
      render(<TransactionForm transaction={transaction} onUpdate={onUpdate} />);
      // fireEvent.submit bypasses the disabled button to reach the handler
      fireEvent.submit(getForm());
      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: 'txn-abc' }));
      });
    });

    it('maps transaction categories to categoryIds in submitted values', async () => {
      const onUpdate = vi.fn();
      const transaction = createTransactionWithDetails({
        id: 'txn-abc',
        categories: [
          { category: { id: 'cat-1', name: 'Food' } },
          { category: { id: 'cat-2', name: 'Travel' } },
        ],
      });
      render(<TransactionForm transaction={transaction} onUpdate={onUpdate} />);
      fireEvent.submit(getForm());
      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ categoryIds: ['cat-1', 'cat-2'] }),
        );
      });
    });
  });

  describe('loading states', () => {
    it('shows "Creating transaction..." banner when isCreating', () => {
      render(<TransactionForm isCreating />);
      expect(screen.getByText('Creating transaction...')).toBeInTheDocument();
    });

    it('shows "Updating transaction..." banner when isUpdating', () => {
      const transaction = createTransactionWithDetails();
      render(<TransactionForm transaction={transaction} isUpdating />);
      expect(screen.getByText('Updating transaction...')).toBeInTheDocument();
    });

    it('disables the submit button when isCreating', () => {
      render(<TransactionForm isCreating />);
      expect(getSubmitButton()).toBeDisabled();
    });

    it('disables the submit button when isUpdating', () => {
      const transaction = createTransactionWithDetails();
      render(<TransactionForm transaction={transaction} isUpdating />);
      expect(getSubmitButton()).toBeDisabled();
    });

    it('disables the Cancel button when isCreating', () => {
      render(<TransactionForm isCreating onClose={vi.fn()} />);
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });

    it('passes isDisabled=true to child fields when isCreating', () => {
      render(<TransactionForm isCreating />);
      expect(lastPayeeFieldProps().isDisabled).toBe(true);
    });

    it('passes isDisabled=false to child fields in normal state', () => {
      render(<TransactionForm />);
      expect(lastPayeeFieldProps().isDisabled).toBe(false);
    });
  });

  describe('vendor change handler', () => {
    it('sets vendorId and vendor name as payee when a known vendor is selected', async () => {
      const onCreate = vi.fn();
      render(<TransactionForm onCreate={onCreate} />);

      await act(async () => {
        lastPayeeFieldProps().onVendorChange('vendor-1');
      });

      fireEvent.submit(getForm());
      await waitFor(() => {
        expect(onCreate).toHaveBeenCalledWith(
          expect.objectContaining({ vendorId: 'vendor-1', payee: 'Acme Corp' }),
        );
      });
    });

    it('sets vendorId without updating payee for an unknown vendor id', async () => {
      const onCreate = vi.fn();
      render(<TransactionForm onCreate={onCreate} />);

      await act(async () => {
        lastPayeeFieldProps().onVendorChange('unknown-id');
      });

      fireEvent.submit(getForm());
      await waitFor(() => {
        expect(onCreate).toHaveBeenCalledWith(
          expect.objectContaining({ vendorId: 'unknown-id', payee: '' }),
        );
      });
    });
  });

  describe('customer change handler', () => {
    it('sets customerId and full name as payee when a known customer is selected', async () => {
      const onCreate = vi.fn();
      render(<TransactionForm onCreate={onCreate} />);

      await act(async () => {
        lastPayeeFieldProps().onCustomerChange('customer-1');
      });

      fireEvent.submit(getForm());
      await waitFor(() => {
        expect(onCreate).toHaveBeenCalledWith(
          expect.objectContaining({ customerId: 'customer-1', payee: 'Jane Smith' }),
        );
      });
    });
  });

  describe('category created handler', () => {
    it('invalidates the transaction categories query when a category is created', () => {
      render(<TransactionForm />);

      act(() => {
        lastCategoryFieldProps().onCategoryCreated({ id: 'cat-new', name: 'Utilities' });
      });

      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['transactions', 'categories'],
      });
    });
  });

  describe('dirty state callback', () => {
    it('calls onDirtyStateChange(true) when a field value changes', async () => {
      const onDirtyStateChange = vi.fn();
      render(<TransactionForm onDirtyStateChange={onDirtyStateChange} />);

      await act(async () => {
        lastPayeeFieldProps().onVendorChange('vendor-1');
      });

      await waitFor(() => {
        expect(onDirtyStateChange).toHaveBeenCalledWith(true);
      });
    });
  });
});
