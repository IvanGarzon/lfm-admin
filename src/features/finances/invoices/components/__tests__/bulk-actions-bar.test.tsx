// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Table, Row } from '@tanstack/react-table';

import { BulkActionsBar } from '../bulk-actions-bar';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>
}));

// -- Helpers ----------------------------------------------------------------

type FakeRow = { id: string };

function makeTable(selectedRows: FakeRow[]): Table<FakeRow> {
  const rows = selectedRows.map((original) => ({ original }) as Row<FakeRow>);
  return {
    getFilteredSelectedRowModel: () => ({ rows }),
    toggleAllPageRowsSelected: vi.fn()
  } as unknown as Table<FakeRow>;
}

// -- Tests ------------------------------------------------------------------

describe('BulkActionsBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Zero selection -------------------------------------------------------

  describe('with no selected rows', () => {
    it('renders nothing', () => {
      const { container } = render(
        <BulkActionsBar table={makeTable([])} onUpdateStatus={vi.fn()} />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  // -- With selections ------------------------------------------------------

  describe('with selected rows', () => {
    it('displays the selected count', () => {
      render(
        <BulkActionsBar table={makeTable([{ id: 'a' }, { id: 'b' }])} onUpdateStatus={vi.fn()} />
      );

      expect(screen.getByText('2 selected')).toBeInTheDocument();
    });

    it('renders Update Status button', () => {
      render(<BulkActionsBar table={makeTable([{ id: 'a' }])} onUpdateStatus={vi.fn()} />);

      expect(screen.getByRole('button', { name: /update status/i })).toBeInTheDocument();
    });

    it('renders Clear selection button', () => {
      render(<BulkActionsBar table={makeTable([{ id: 'a' }])} onUpdateStatus={vi.fn()} />);

      expect(screen.getByRole('button', { name: /clear selection/i })).toBeInTheDocument();
    });

    it('calls toggleAllPageRowsSelected(false) when Clear selection is clicked', () => {
      const table = makeTable([{ id: 'a' }]);
      render(<BulkActionsBar table={table} onUpdateStatus={vi.fn()} />);

      fireEvent.click(screen.getByRole('button', { name: /clear selection/i }));

      expect(table.toggleAllPageRowsSelected).toHaveBeenCalledWith(false);
    });

    it('disables Update Status when isPending is true', () => {
      render(
        <BulkActionsBar
          table={makeTable([{ id: 'a' }])}
          onUpdateStatus={vi.fn()}
          isPending={true}
        />
      );

      expect(screen.getByRole('button', { name: /update status/i })).toBeDisabled();
    });

    it('calls onUpdateStatus with PENDING status when Mark as Pending is clicked', () => {
      const onUpdateStatus = vi.fn();
      const row = { id: 'inv-1' };
      render(<BulkActionsBar table={makeTable([row])} onUpdateStatus={onUpdateStatus} />);

      fireEvent.click(screen.getByText('Mark as Pending'));

      expect(onUpdateStatus).toHaveBeenCalledWith([row], 'PENDING');
    });

    it('calls onUpdateStatus with CANCELLED status when Mark as Cancelled is clicked', () => {
      const onUpdateStatus = vi.fn();
      const row = { id: 'inv-1' };
      render(<BulkActionsBar table={makeTable([row])} onUpdateStatus={onUpdateStatus} />);

      fireEvent.click(screen.getByText('Mark as Cancelled'));

      expect(onUpdateStatus).toHaveBeenCalledWith([row], 'CANCELLED');
    });
  });
});
