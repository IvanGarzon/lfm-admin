// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

import { CustomersList } from '../customers-list';

// -- Mocks ------------------------------------------------------------------

const mockMutate = vi.fn();
const mockDeleteCustomer = { mutate: mockMutate, isPending: false };

const { mockUseCustomers, mockUseQueryStates } = vi.hoisted(() => ({
  mockUseCustomers: vi.fn(),
  mockUseQueryStates: vi.fn(() => [
    { search: '', page: 1, perPage: 20, status: [], sort: [] },
    vi.fn()
  ])
}));

vi.mock('nuqs', () => ({
  useQueryStates: mockUseQueryStates
}));

vi.mock('@/features/crm/customers/hooks/use-customer-queries', () => ({
  useCustomers: mockUseCustomers,
  useDeleteCustomer: () => mockDeleteCustomer
}));

vi.mock('@/features/crm/customers/components/customer-columns', () => ({
  createCustomerColumns: vi.fn(() => [])
}));

vi.mock('@/features/crm/customers/components/customers-table', () => ({
  CustomersTable: () => <div data-testid='customers-table' />
}));

vi.mock('@/features/crm/customers/components/customer-drawer', () => ({
  CustomerDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid='customer-drawer' /> : null
}));

vi.mock('next/dynamic', () => ({
  default:
    () =>
    ({ open, onClose }: { open: boolean; onClose: () => void }) =>
      open ? <div data-testid='customer-drawer' onClick={onClose} /> : null
}));

vi.mock('@/features/crm/customers/components/delete-customer-dialog', () => ({
  DeleteCustomerDialog: ({
    open,
    onConfirm,
    onOpenChange
  }: {
    open: boolean;
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
    customerName?: string;
    isPending?: boolean;
  }) =>
    open ? (
      <div data-testid='delete-customer-dialog'>
        <button onClick={onConfirm}>Confirm delete</button>
        <button onClick={() => onOpenChange(false)}>Cancel</button>
      </div>
    ) : null
}));

vi.mock('@/hooks/use-data-table', async () => {
  const { useDataTableMock } = await import('@/lib/testing/mocks/use-data-table.mock');
  return useDataTableMock;
});

vi.mock('@/components/shared/empty-state', async () => {
  const { emptyStateMock } = await import('@/lib/testing/mocks/empty-state.mock');
  return emptyStateMock;
});

// -- Helpers ----------------------------------------------------------------

import { createCustomerListItem } from '@/lib/testing/factories/customer.factory';

function makeData(totalItems: number) {
  return {
    items: Array.from({ length: totalItems }, (_, i) =>
      createCustomerListItem({
        id: `customer-${i}`,
        lastName: `Smith-${i}`,
        email: `jane${i}@example.com`
      })
    ),
    pagination: { totalItems, page: 1, perPage: 20, totalPages: 1 }
  };
}

// -- Tests ------------------------------------------------------------------

describe('CustomersList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Zero state -----------------------------------------------------------

  describe('zero state', () => {
    beforeEach(() => {
      mockUseCustomers.mockReturnValue({ data: makeData(0) });
    });

    it('renders EmptyState when there are no customers and no active filters', () => {
      render(<CustomersList />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('does not render the page heading in zero state', () => {
      render(<CustomersList />);

      expect(screen.queryByRole('heading', { name: 'Customers' })).not.toBeInTheDocument();
    });

    it('does not render CustomersTable in zero state', () => {
      render(<CustomersList />);

      expect(screen.queryByTestId('customers-table')).not.toBeInTheDocument();
    });

    it('renders EmptyState with Add Customer action button', () => {
      render(<CustomersList />);

      expect(screen.getByRole('button', { name: /add customer/i })).toBeInTheDocument();
    });

    it('does not show EmptyState when a search filter is active even if results are empty', () => {
      mockUseQueryStates.mockReturnValueOnce([
        { search: 'Alice', page: 1, perPage: 20, status: [], sort: [] },
        vi.fn()
      ]);
      render(<CustomersList />);

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });

    it('does not show EmptyState when both page and search params are present in the URL', () => {
      mockUseQueryStates.mockReturnValueOnce([
        { search: 'dsfdfsdf', page: 1, perPage: 20, status: [], sort: [] },
        vi.fn()
      ]);
      render(<CustomersList />);

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
      expect(screen.getByTestId('customers-table')).toBeInTheDocument();
    });
  });

  // -- Normal state (customers exist) ---------------------------------------

  describe('normal state', () => {
    beforeEach(() => {
      mockUseCustomers.mockReturnValue({ data: makeData(3) });
    });

    it('renders the Customers page heading', () => {
      render(<CustomersList />);
      expect(screen.getByRole('heading', { name: 'Customers' })).toBeInTheDocument();
    });

    it('renders the CustomersTable', () => {
      render(<CustomersList />);
      expect(screen.getByTestId('customers-table')).toBeInTheDocument();
    });

    it('renders Add Customer button', () => {
      render(<CustomersList />);
      expect(screen.getByRole('button', { name: /add customer/i })).toBeInTheDocument();
    });

    it('does not render EmptyState when customers exist', () => {
      render(<CustomersList />);
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });
  });

  // -- Loading / no data yet ------------------------------------------------

  describe('when data is undefined (loading)', () => {
    it('does not crash and renders zero state based on undefined data', () => {
      mockUseCustomers.mockReturnValue({ data: undefined });
      render(<CustomersList />);
      // totalItems defaults to 0 — zero state renders
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  // -- Create modal ---------------------------------------------------------

  describe('create modal', () => {
    beforeEach(() => {
      mockUseCustomers.mockReturnValue({ data: makeData(3) });
    });

    it('does not render CustomerDrawer initially', () => {
      render(<CustomersList />);
      expect(screen.queryByTestId('customer-drawer')).not.toBeInTheDocument();
    });

    it('opens CustomerDrawer when Add Customer button is clicked', () => {
      render(<CustomersList />);
      fireEvent.click(screen.getByRole('button', { name: /add customer/i }));
      expect(screen.getByTestId('customer-drawer')).toBeInTheDocument();
    });
  });

  describe('create modal from zero state', () => {
    beforeEach(() => {
      mockUseCustomers.mockReturnValue({ data: makeData(0) });
    });

    it('opens CustomerDrawer from the EmptyState Add Customer button', () => {
      render(<CustomersList />);
      fireEvent.click(screen.getByRole('button', { name: /add customer/i }));
      expect(screen.getByTestId('customer-drawer')).toBeInTheDocument();
    });
  });

  // -- Delete confirmation --------------------------------------------------

  describe('delete confirmation', () => {
    let capturedDeleteFn: ((id: string, name: string) => void) | undefined;

    beforeEach(async () => {
      mockUseCustomers.mockReturnValue({ data: makeData(3) });

      const { createCustomerColumns } = vi.mocked(
        await import('@/features/crm/customers/components/customer-columns')
      );
      (createCustomerColumns as ReturnType<typeof vi.fn>).mockImplementation(
        (onDelete: (id: string, name: string) => void) => {
          capturedDeleteFn = onDelete;
          return [];
        }
      );
    });

    it('does not show delete dialog initially', () => {
      render(<CustomersList />);
      expect(screen.queryByTestId('delete-customer-dialog')).not.toBeInTheDocument();
    });

    it('opens delete dialog when onDelete is called from columns', () => {
      render(<CustomersList />);
      act(() => capturedDeleteFn?.('customer-0', 'Jane Smith-0'));
      expect(screen.getByTestId('delete-customer-dialog')).toBeInTheDocument();
    });

    it('calls deleteCustomer.mutate when dialog confirm is clicked', () => {
      render(<CustomersList />);
      act(() => capturedDeleteFn?.('customer-0', 'Jane Smith-0'));
      fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }));
      expect(mockMutate).toHaveBeenCalledWith(
        { id: 'customer-0' },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
    });

    it('does not call deleteCustomer.mutate when dialog is cancelled', () => {
      render(<CustomersList />);
      act(() => capturedDeleteFn?.('customer-0', 'Jane Smith-0'));
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('closes delete dialog when cancelled', () => {
      render(<CustomersList />);
      act(() => capturedDeleteFn?.('customer-0', 'Jane Smith-0'));
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(screen.queryByTestId('delete-customer-dialog')).not.toBeInTheDocument();
    });
  });
});
