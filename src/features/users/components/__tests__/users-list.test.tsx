// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { UsersList } from '../users-list';

// -- Mocks ------------------------------------------------------------------

const { mockUseUsers } = vi.hoisted(() => ({
  mockUseUsers: vi.fn()
}));

vi.mock('@/features/users/hooks/use-user-queries', () => ({
  useUsers: mockUseUsers
}));

vi.mock('@/hooks/use-data-table', async () => {
  const { useDataTableMock } = await import('@/lib/testing/mocks/use-data-table.mock');
  return useDataTableMock;
});

vi.mock('@/filters/users/users-filters', () => ({
  searchParams: {
    search: { defaultValue: '' }
  }
}));

vi.mock('@/features/users/components/user-columns', () => ({
  userColumns: []
}));

vi.mock('@/components/shared/empty-state', async () => {
  const { emptyStateMock } = await import('@/lib/testing/mocks/empty-state.mock');
  return emptyStateMock;
});

vi.mock('@/features/users/components/users-table', () => ({
  UsersTable: ({ totalItems }: { totalItems: number }) => (
    <div data-testid='users-table' data-total={totalItems} />
  )
}));

// Stub next/dynamic — respects open prop so modal presence can be asserted.
vi.mock('next/dynamic', () => ({
  default: () =>
    function DynamicStub({ open, onOpenChange }: { open?: boolean; onOpenChange?: () => void }) {
      return open ? <div data-testid='user-invite-modal' onClick={onOpenChange} /> : null;
    }
}));

// -- Helpers ----------------------------------------------------------------

import { createUserListItem } from '@/lib/testing/factories/user.factory';

const activeSearchParams = { search: 'Alice' };
const emptySearchParams = {};

function makeData(totalItems: number) {
  return {
    items: Array.from({ length: totalItems }, (_, i) => createUserListItem({ id: `u-${i}` })),
    pagination: {
      totalItems,
      totalPages: totalItems > 0 ? 1 : 0,
      currentPage: 1,
      hasNextPage: false,
      hasPreviousPage: false,
      nextPage: null,
      previousPage: null
    }
  };
}

// -- Tests ------------------------------------------------------------------

describe('UsersList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('zero state', () => {
    beforeEach(() => {
      mockUseUsers.mockReturnValue({ data: makeData(0) });
    });

    it('renders EmptyState when there are no users and no active filters', () => {
      render(<UsersList searchParams={emptySearchParams} />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('does not render the page heading in zero state', () => {
      render(<UsersList searchParams={emptySearchParams} />);

      expect(screen.queryByRole('heading', { name: 'Users' })).not.toBeInTheDocument();
    });

    it('does not render UsersTable in zero state', () => {
      render(<UsersList searchParams={emptySearchParams} />);

      expect(screen.queryByTestId('users-table')).not.toBeInTheDocument();
    });

    it('renders EmptyState with Invite User action button', () => {
      render(<UsersList searchParams={emptySearchParams} />);

      expect(screen.getByRole('button', { name: /invite user/i })).toBeInTheDocument();
    });

    it('does not show EmptyState when a search filter is active even if results are empty', () => {
      render(<UsersList searchParams={activeSearchParams} />);

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });
  });

  describe('normal state', () => {
    beforeEach(() => {
      mockUseUsers.mockReturnValue({ data: makeData(2) });
    });

    it('renders the Users page heading', () => {
      render(<UsersList searchParams={emptySearchParams} />);

      expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument();
    });

    it('renders UsersTable with totalItems', () => {
      render(<UsersList searchParams={emptySearchParams} />);

      const table = screen.getByTestId('users-table');
      expect(table).toBeInTheDocument();
      expect(table).toHaveAttribute('data-total', '2');
    });

    it('renders Invite User button', () => {
      render(<UsersList searchParams={emptySearchParams} />);

      expect(screen.getByRole('button', { name: /invite user/i })).toBeInTheDocument();
    });

    it('does not render EmptyState when users exist', () => {
      render(<UsersList searchParams={emptySearchParams} />);

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });
  });

  describe('when data is not yet loaded', () => {
    it('does not crash and renders zero state based on undefined data', () => {
      mockUseUsers.mockReturnValue({ data: undefined });

      render(<UsersList searchParams={emptySearchParams} />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  describe('invite modal', () => {
    beforeEach(() => {
      mockUseUsers.mockReturnValue({ data: makeData(2) });
    });

    it('does not render invite modal initially', () => {
      render(<UsersList searchParams={emptySearchParams} />);

      expect(screen.queryByTestId('user-invite-modal')).not.toBeInTheDocument();
    });

    it('opens invite modal when the "Invite User" button is clicked', () => {
      render(<UsersList searchParams={emptySearchParams} />);

      fireEvent.click(screen.getByRole('button', { name: /invite user/i }));

      expect(screen.getByTestId('user-invite-modal')).toBeInTheDocument();
    });
  });

  describe('invite modal from zero state', () => {
    beforeEach(() => {
      mockUseUsers.mockReturnValue({ data: makeData(0) });
    });

    it('opens invite modal from the EmptyState Invite User button', () => {
      render(<UsersList searchParams={emptySearchParams} />);

      fireEvent.click(screen.getByRole('button', { name: /invite user/i }));

      expect(screen.getByTestId('user-invite-modal')).toBeInTheDocument();
    });
  });
});
