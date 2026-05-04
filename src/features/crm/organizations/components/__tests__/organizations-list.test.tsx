// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

import { OrganizationsList } from '../organizations-list';

// -- Mocks ------------------------------------------------------------------

const mockMutateDelete = vi.fn();
const mockMutateCreate = vi.fn();
const mockMutateUpdate = vi.fn();

const {
  mockUseOrganizationsList,
  mockUseDeleteOrganization,
  mockUseCreateOrganization,
  mockUseUpdateOrganization
} = vi.hoisted(() => ({
  mockUseOrganizationsList: vi.fn(),
  mockUseDeleteOrganization: vi.fn(),
  mockUseCreateOrganization: vi.fn(),
  mockUseUpdateOrganization: vi.fn()
}));

vi.mock('nuqs', () => ({
  useQueryStates: vi.fn(() => [{ name: '', page: 1, perPage: 20, status: [], sort: [] }, vi.fn()])
}));

vi.mock('@/features/crm/organizations/hooks/use-organization-queries', () => ({
  useOrganizationsList: mockUseOrganizationsList,
  useDeleteOrganization: mockUseDeleteOrganization,
  useCreateOrganization: mockUseCreateOrganization,
  useUpdateOrganization: mockUseUpdateOrganization
}));

vi.mock('@/features/crm/organizations/components/organization-columns', () => ({
  createOrganizationColumns: vi.fn(() => [])
}));

vi.mock('@/features/crm/organizations/components/organizations-table', () => ({
  OrganizationsTable: () => <div data-testid='organizations-table' />
}));

vi.mock('@/features/crm/organizations/components/organization-form', () => ({
  OrganizationForm: ({
    onCreate,
    onUpdate,
    onClose
  }: {
    onCreate?: (data: unknown) => void;
    onUpdate?: (data: unknown) => void;
    onClose?: () => void;
  }) => (
    <div data-testid='organization-form'>
      {onCreate && <button onClick={() => onCreate({ name: 'Test Org' })}>Submit create</button>}
      {onUpdate && (
        <button onClick={() => onUpdate({ id: 'org-1', name: 'Updated Org' })}>
          Submit update
        </button>
      )}
      <button onClick={onClose}>Close form</button>
    </div>
  )
}));

vi.mock('@/features/crm/organizations/components/delete-organization-dialog', () => ({
  DeleteOrganizationDialog: ({
    open,
    onConfirm,
    onOpenChange
  }: {
    open: boolean;
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
    organizationName?: string;
    customersCount?: number;
    isPending?: boolean;
  }) =>
    open ? (
      <div data-testid='delete-organization-dialog'>
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

vi.mock('@/filters/organizations/organizations-filters', () => ({
  searchParams: { name: { defaultValue: '' } },
  organizationSearchParamsDefaults: {}
}));

// -- Helpers ----------------------------------------------------------------

import { createOrganizationResponse } from '@/lib/testing/factories/organization.factory';

const emptySearchParams = {};
const activeSearchParams = { name: 'Acme' };

function makeData(totalItems: number) {
  return {
    items: Array.from({ length: totalItems }, (_, i) =>
      createOrganizationResponse({ id: `org-${i}`, name: `Org ${i}` })
    ),
    pagination: { totalItems, page: 1, perPage: 20, totalPages: 1 }
  };
}

function makeDefaultMutationMocks() {
  mockUseDeleteOrganization.mockReturnValue({ mutate: mockMutateDelete, isPending: false });
  mockUseCreateOrganization.mockReturnValue({ mutate: mockMutateCreate, isPending: false });
  mockUseUpdateOrganization.mockReturnValue({ mutate: mockMutateUpdate, isPending: false });
}

// -- Tests ------------------------------------------------------------------

describe('OrganizationsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    makeDefaultMutationMocks();
  });

  // -- Zero state -----------------------------------------------------------

  describe('zero state', () => {
    beforeEach(() => {
      mockUseOrganizationsList.mockReturnValue({ data: makeData(0) });
    });

    it('renders EmptyState when there are no organisations and no active filters', () => {
      render(<OrganizationsList searchParams={emptySearchParams} />);
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('does not render the page heading in zero state', () => {
      render(<OrganizationsList searchParams={emptySearchParams} />);
      expect(screen.queryByRole('heading', { name: 'Organizations' })).not.toBeInTheDocument();
    });

    it('does not render OrganizationsTable in zero state', () => {
      render(<OrganizationsList searchParams={emptySearchParams} />);
      expect(screen.queryByTestId('organizations-table')).not.toBeInTheDocument();
    });

    it('renders Add Organization button in empty state', () => {
      render(<OrganizationsList searchParams={emptySearchParams} />);
      expect(screen.getByRole('button', { name: /add organization/i })).toBeInTheDocument();
    });

    it('does not show EmptyState when a search filter is active even if results are empty', () => {
      render(<OrganizationsList searchParams={activeSearchParams} />);
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });
  });

  // -- Normal state ---------------------------------------------------------

  describe('normal state', () => {
    beforeEach(() => {
      mockUseOrganizationsList.mockReturnValue({ data: makeData(3) });
    });

    it('renders the Organizations page heading', () => {
      render(<OrganizationsList searchParams={emptySearchParams} />);
      expect(screen.getByRole('heading', { name: 'Organizations' })).toBeInTheDocument();
    });

    it('renders the OrganizationsTable', () => {
      render(<OrganizationsList searchParams={emptySearchParams} />);
      expect(screen.getByTestId('organizations-table')).toBeInTheDocument();
    });

    it('renders Add Organization button', () => {
      render(<OrganizationsList searchParams={emptySearchParams} />);
      expect(screen.getByRole('button', { name: /add organization/i })).toBeInTheDocument();
    });

    it('does not render EmptyState when organisations exist', () => {
      render(<OrganizationsList searchParams={emptySearchParams} />);
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });
  });

  // -- Loading / no data yet ------------------------------------------------

  describe('when data is undefined (loading)', () => {
    it('renders zero state when data is not yet loaded', () => {
      mockUseOrganizationsList.mockReturnValue({ data: undefined });
      render(<OrganizationsList searchParams={emptySearchParams} />);
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  // -- Create modal ---------------------------------------------------------

  describe('create modal', () => {
    beforeEach(() => {
      mockUseOrganizationsList.mockReturnValue({ data: makeData(3) });
    });

    it('does not render create dialog initially', () => {
      render(<OrganizationsList searchParams={emptySearchParams} />);
      expect(
        screen.queryByRole('heading', { name: /create organization/i })
      ).not.toBeInTheDocument();
    });

    it('opens create dialog when Add Organization button is clicked', () => {
      render(<OrganizationsList searchParams={emptySearchParams} />);
      fireEvent.click(screen.getByRole('button', { name: /add organization/i }));
      expect(screen.getByRole('heading', { name: /create organization/i })).toBeInTheDocument();
    });

    it('opens create dialog from zero state Add Organization button', () => {
      mockUseOrganizationsList.mockReturnValue({ data: makeData(0) });
      render(<OrganizationsList searchParams={emptySearchParams} />);
      fireEvent.click(screen.getByRole('button', { name: /add organization/i }));
      expect(screen.getByRole('heading', { name: /create organization/i })).toBeInTheDocument();
    });

    it('calls createOrganization.mutate when form is submitted', () => {
      render(<OrganizationsList searchParams={emptySearchParams} />);
      fireEvent.click(screen.getByRole('button', { name: /add organization/i }));
      fireEvent.click(screen.getByRole('button', { name: /submit create/i }));
      expect(mockMutateCreate).toHaveBeenCalledWith(
        { name: 'Test Org' },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
    });
  });

  // -- Delete confirmation --------------------------------------------------

  describe('delete confirmation', () => {
    let capturedDeleteFn: ((id: string, name: string, customersCount: number) => void) | undefined;

    beforeEach(async () => {
      mockUseOrganizationsList.mockReturnValue({ data: makeData(3) });

      const { createOrganizationColumns } = vi.mocked(
        await import('@/features/crm/organizations/components/organization-columns')
      );
      (createOrganizationColumns as ReturnType<typeof vi.fn>).mockImplementation(
        (onDelete: (id: string, name: string, customersCount: number) => void) => {
          capturedDeleteFn = onDelete;
          return [];
        }
      );
    });

    it('does not show delete dialog initially', () => {
      render(<OrganizationsList searchParams={emptySearchParams} />);
      expect(screen.queryByTestId('delete-organization-dialog')).not.toBeInTheDocument();
    });

    it('opens delete dialog when onDelete is triggered from columns', () => {
      render(<OrganizationsList searchParams={emptySearchParams} />);
      act(() => capturedDeleteFn?.('org-0', 'Org 0', 0));
      expect(screen.getByTestId('delete-organization-dialog')).toBeInTheDocument();
    });

    it('calls deleteOrganization.mutate when dialog confirm is clicked', () => {
      render(<OrganizationsList searchParams={emptySearchParams} />);
      act(() => capturedDeleteFn?.('org-0', 'Org 0', 0));
      fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }));
      expect(mockMutateDelete).toHaveBeenCalledWith(
        { id: 'org-0' },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
    });

    it('does not call deleteOrganization.mutate when dialog is cancelled', () => {
      render(<OrganizationsList searchParams={emptySearchParams} />);
      act(() => capturedDeleteFn?.('org-0', 'Org 0', 0));
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockMutateDelete).not.toHaveBeenCalled();
    });

    it('closes delete dialog when cancelled', () => {
      render(<OrganizationsList searchParams={emptySearchParams} />);
      act(() => capturedDeleteFn?.('org-0', 'Org 0', 0));
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(screen.queryByTestId('delete-organization-dialog')).not.toBeInTheDocument();
    });
  });
});
