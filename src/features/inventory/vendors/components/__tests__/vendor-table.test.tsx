// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VendorTable } from '../vendor-table';
import { createVendorListItem } from '@/lib/testing/factories/vendor.factory';

// -- Mocks ------------------------------------------------------------------

const mockPrefetch = vi.fn();

vi.mock('@/features/inventory/vendors/hooks/use-vendor-queries', () => ({
  usePrefetchVendor: () => mockPrefetch
}));

vi.mock('@/components/shared/tableV3/data-table', () => ({
  DataTable: ({ onRowHover }: { onRowHover?: (row: unknown) => void }) => (
    <div data-testid='data-table' onMouseEnter={() => onRowHover?.({ id: 'v1' })} />
  )
}));

vi.mock('@/components/shared/tableV3/data-table-toolbar', () => ({
  DataTableToolbar: () => <div data-testid='data-table-toolbar' />
}));

// -- Tests ------------------------------------------------------------------

const mockTable = {} as Parameters<typeof VendorTable>[0]['table'];

describe('VendorTable', () => {
  // -- Empty state ----------------------------------------------------------

  it('shows empty message when items is empty', () => {
    render(<VendorTable table={mockTable} items={[]} totalItems={0} />);
    expect(screen.getByText(/no vendors found/i)).toBeInTheDocument();
  });

  it('does not render DataTable when items is empty', () => {
    render(<VendorTable table={mockTable} items={[]} totalItems={0} />);
    expect(screen.queryByTestId('data-table')).not.toBeInTheDocument();
  });

  // -- With data ------------------------------------------------------------

  it('renders DataTable when items are present', () => {
    const items = [createVendorListItem({ id: 'v1' })];
    render(<VendorTable table={mockTable} items={items} totalItems={1} />);
    expect(screen.getByTestId('data-table')).toBeInTheDocument();
  });

  it('renders DataTableToolbar', () => {
    const items = [createVendorListItem({ id: 'v1' })];
    render(<VendorTable table={mockTable} items={items} totalItems={1} />);
    expect(screen.getByTestId('data-table-toolbar')).toBeInTheDocument();
  });
});
