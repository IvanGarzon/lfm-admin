// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Table } from '@tanstack/react-table';

import { OrganizationsTable } from '../organizations-table';
import type { OrganizationListItem } from '@/features/crm/organizations/types';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/components/shared/tableV3/data-table', () => ({
  DataTable: () => <div data-testid='data-table' />
}));

vi.mock('@/components/shared/tableV3/data-table-toolbar', () => ({
  DataTableToolbar: () => <div data-testid='data-table-toolbar' />
}));

// -- Helpers ----------------------------------------------------------------

const fakeTable = {} as Table<OrganizationListItem>;

// -- Tests ------------------------------------------------------------------

describe('OrganizationsTable', () => {
  it('renders the toolbar', () => {
    render(<OrganizationsTable table={fakeTable} items={[]} totalItems={0} />);
    expect(screen.getByTestId('data-table-toolbar')).toBeInTheDocument();
  });

  it('renders DataTable when items exist', () => {
    const items = [{ id: 'org-1' }] as OrganizationListItem[];
    render(<OrganizationsTable table={fakeTable} items={items} totalItems={1} />);
    expect(screen.getByTestId('data-table')).toBeInTheDocument();
  });

  it('shows empty message when items array is empty', () => {
    render(<OrganizationsTable table={fakeTable} items={[]} totalItems={0} />);
    expect(screen.getByText(/no organizations found/i)).toBeInTheDocument();
  });

  it('does not render DataTable when items array is empty', () => {
    render(<OrganizationsTable table={fakeTable} items={[]} totalItems={0} />);
    expect(screen.queryByTestId('data-table')).not.toBeInTheDocument();
  });
});
