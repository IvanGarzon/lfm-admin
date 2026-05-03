// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { UsersTable } from '../users-table';

// -- Mocks ------------------------------------------------------------------

const mockPrefetch = vi.fn();

vi.mock('@/features/users/hooks/use-user-queries', () => ({
  usePrefetchTenantUser: () => mockPrefetch
}));

vi.mock('@/components/shared/tableV3/data-table', () => ({
  DataTable: ({
    onRowHover,
    totalItems
  }: {
    onRowHover?: (row: unknown) => void;
    totalItems: number;
  }) => (
    <div data-testid='data-table' data-total={totalItems}>
      <button onClick={() => onRowHover?.({ id: 'hover-id' })}>Hover Row</button>
    </div>
  )
}));

vi.mock('@/components/shared/tableV3/data-table-toolbar', () => ({
  DataTableToolbar: () => <div data-testid='data-table-toolbar' />
}));

// -- Helpers ----------------------------------------------------------------

const stubTable = {} as Parameters<typeof UsersTable>[0]['table'];

// -- Tests ------------------------------------------------------------------

describe('UsersTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('empty state', () => {
    it('shows "No users found" message when items list is empty', () => {
      render(<UsersTable table={stubTable} items={[]} totalItems={0} />);
      expect(screen.getByText(/no users found/i)).toBeInTheDocument();
    });

    it('does not render DataTable when items list is empty', () => {
      render(<UsersTable table={stubTable} items={[]} totalItems={0} />);
      expect(screen.queryByTestId('data-table')).not.toBeInTheDocument();
    });

    it('still renders the toolbar when items list is empty', () => {
      render(<UsersTable table={stubTable} items={[]} totalItems={0} />);
      expect(screen.getByTestId('data-table-toolbar')).toBeInTheDocument();
    });
  });

  describe('normal state', () => {
    const items = [{ id: 'u-1' }, { id: 'u-2' }];

    it('renders DataTable when items are present', () => {
      render(<UsersTable table={stubTable} items={items} totalItems={2} />);
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });

    it('passes totalItems to DataTable', () => {
      render(<UsersTable table={stubTable} items={items} totalItems={2} />);
      expect(screen.getByTestId('data-table')).toHaveAttribute('data-total', '2');
    });

    it('does not show the empty state message when items are present', () => {
      render(<UsersTable table={stubTable} items={items} totalItems={2} />);
      expect(screen.queryByText(/no users found/i)).not.toBeInTheDocument();
    });
  });

  describe('row hover prefetch', () => {
    it('calls prefetchTenantUser with the hovered user id', () => {
      render(<UsersTable table={stubTable} items={[{ id: 'u-1' }]} totalItems={1} />);
      fireEvent.click(screen.getByRole('button', { name: 'Hover Row' }));
      expect(mockPrefetch).toHaveBeenCalledWith('hover-id');
    });
  });
});
