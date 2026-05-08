// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VendorList } from '../vendor-list';
import { createVendorListItem } from '@/lib/testing/factories/vendor.factory';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/features/inventory/vendors/context/vendor-action-context', () => ({
  useVendorActions: () => ({ openDelete: vi.fn() })
}));

vi.mock('@/features/inventory/vendors/components/vendor-columns', () => ({
  createVendorColumns: vi.fn(() => [])
}));

vi.mock('@/features/inventory/vendors/components/vendor-table', () => ({
  VendorTable: () => <div data-testid='vendor-table' />
}));

vi.mock('@/hooks/use-data-table', async () => {
  const { useDataTableMock } = await import('@/lib/testing/mocks/use-data-table.mock');
  return useDataTableMock;
});

// -- Helpers ----------------------------------------------------------------

function makeData(totalItems: number) {
  return {
    items: Array.from({ length: totalItems }, (_, i) =>
      createVendorListItem({ id: `vendor-${i}` })
    ),
    pagination: {
      totalItems,
      totalPages: Math.ceil(totalItems / 20),
      currentPage: 1,
      hasNextPage: false,
      hasPreviousPage: false,
      nextPage: null,
      previousPage: null
    }
  };
}

// -- Tests ------------------------------------------------------------------

describe('VendorList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders VendorTable', () => {
    render(<VendorList data={makeData(3)} />);
    expect(screen.getByTestId('vendor-table')).toBeInTheDocument();
  });

  it('renders without crashing when data is undefined', () => {
    expect(() => render(<VendorList />)).not.toThrow();
  });

  it('renders VendorTable even when data is undefined', () => {
    render(<VendorList />);
    expect(screen.getByTestId('vendor-table')).toBeInTheDocument();
  });
});
