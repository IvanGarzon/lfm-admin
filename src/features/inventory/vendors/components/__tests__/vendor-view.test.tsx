// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VendorsView } from '../vendor-view';

// -- Mocks ------------------------------------------------------------------

const mockUseVendors = vi.fn();
const mockUseVendorStatistics = vi.fn(() => ({ data: undefined, isLoading: false }));

const { mockUseQueryStates } = vi.hoisted(() => ({
  mockUseQueryStates: vi.fn(() => [
    { search: '', page: 1, perPage: 20, status: [], sort: [] },
    vi.fn()
  ])
}));

vi.mock('nuqs', () => ({
  useQueryStates: mockUseQueryStates
}));

vi.mock('@/features/inventory/vendors/hooks/use-vendor-queries', () => ({
  useVendors: (...args: unknown[]) => mockUseVendors(...args),
  useVendorStatistics: (...args: unknown[]) => mockUseVendorStatistics(...args)
}));

vi.mock('@/features/inventory/vendors/components/vendor-list', () => ({
  VendorList: () => <div data-testid='vendor-list' />
}));

vi.mock('@/components/shared/empty-state', async () => {
  const { emptyStateMock } = await import('@/lib/testing/mocks/empty-state.mock');
  return emptyStateMock;
});

vi.mock('next/dynamic', () => ({
  default:
    () =>
    ({ open, onClose }: { open: boolean; onClose: () => void }) =>
      open ? <div data-testid='vendor-drawer' /> : null
}));

// -- Helpers ----------------------------------------------------------------

import {
  createVendorListItem,
  createVendorStatistics
} from '@/lib/testing/factories/vendor.factory';

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

describe('VendorsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseVendorStatistics.mockReturnValue({ data: undefined, isLoading: false });
    mockUseQueryStates.mockReturnValue([
      { search: '', page: 1, perPage: 20, status: [], sort: [] },
      vi.fn()
    ]);
  });

  // -- Zero state -----------------------------------------------------------

  describe('zero state', () => {
    beforeEach(() => {
      mockUseVendors.mockReturnValue({ data: makeData(0) });
    });

    it('renders EmptyState when there are no vendors and no active filters', () => {
      render(<VendorsView />);
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('does not render the Vendors heading in zero state', () => {
      render(<VendorsView />);
      expect(screen.queryByRole('heading', { name: 'Vendors' })).not.toBeInTheDocument();
    });

    it('does not render VendorList in zero state', () => {
      render(<VendorsView />);
      expect(screen.queryByTestId('vendor-list')).not.toBeInTheDocument();
    });

    it('renders an Add Vendor button in the EmptyState', () => {
      render(<VendorsView />);
      expect(screen.getByRole('button', { name: /add vendor/i })).toBeInTheDocument();
    });

    it('does not show EmptyState when a search filter is active with zero results', () => {
      mockUseQueryStates.mockReturnValueOnce([
        { search: 'acme', page: 1, perPage: 20, status: [], sort: [] },
        vi.fn()
      ]);
      render(<VendorsView />);
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });

    it('does not show EmptyState when a status filter is active with zero results', () => {
      mockUseQueryStates.mockReturnValueOnce([
        { search: '', page: 1, perPage: 20, status: ['INACTIVE'], sort: [] },
        vi.fn()
      ]);
      render(<VendorsView />);
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });
  });

  // -- Undefined data -------------------------------------------------------

  describe('when data is undefined', () => {
    it('renders EmptyState when data is undefined and no active filters', () => {
      mockUseVendors.mockReturnValue({ data: undefined });
      render(<VendorsView />);
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('does not crash when data is undefined', () => {
      mockUseVendors.mockReturnValue({ data: undefined });
      expect(() => render(<VendorsView />)).not.toThrow();
    });
  });

  // -- Normal state ---------------------------------------------------------

  describe('normal state', () => {
    beforeEach(() => {
      mockUseVendors.mockReturnValue({ data: makeData(5) });
    });

    it('renders the Vendors heading', () => {
      render(<VendorsView />);
      expect(screen.getByRole('heading', { name: 'Vendors' })).toBeInTheDocument();
    });

    it('renders VendorList', () => {
      render(<VendorsView />);
      expect(screen.getByTestId('vendor-list')).toBeInTheDocument();
    });

    it('does not render EmptyState when vendors exist', () => {
      render(<VendorsView />);
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });

    it('renders an Add Vendor button', () => {
      render(<VendorsView />);
      expect(screen.getByRole('button', { name: /add vendor/i })).toBeInTheDocument();
    });
  });

  // -- Statistics -----------------------------------------------------------

  describe('statistics', () => {
    beforeEach(() => {
      mockUseVendors.mockReturnValue({ data: makeData(5) });
    });

    it('does not render stats when data is loading', () => {
      mockUseVendorStatistics.mockReturnValue({ data: undefined, isLoading: true });
      render(<VendorsView />);
      expect(screen.queryByText('Total Vendors')).not.toBeInTheDocument();
    });

    it('does not render stats when data is undefined', () => {
      mockUseVendorStatistics.mockReturnValue({ data: undefined, isLoading: false });
      render(<VendorsView />);
      expect(screen.queryByText('Total Vendors')).not.toBeInTheDocument();
    });

    it('renders stat cards when statistics are loaded', () => {
      mockUseVendorStatistics.mockReturnValue({
        data: createVendorStatistics({ total: 50, active: 40, inactive: 8, suspended: 2 }),
        isLoading: false
      });
      render(<VendorsView />);
      expect(screen.getByText('Total Vendors')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
      expect(screen.getByText('Suspended')).toBeInTheDocument();
    });

    it('renders correct stat values', () => {
      mockUseVendorStatistics.mockReturnValue({
        data: createVendorStatistics({ total: 50, active: 40, inactive: 8, suspended: 2 }),
        isLoading: false
      });
      render(<VendorsView />);
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('40')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  // -- Create drawer --------------------------------------------------------

  describe('create drawer', () => {
    beforeEach(() => {
      mockUseVendors.mockReturnValue({ data: makeData(3) });
    });

    it('does not render VendorDrawer initially', () => {
      render(<VendorsView />);
      expect(screen.queryByTestId('vendor-drawer')).not.toBeInTheDocument();
    });

    it('opens VendorDrawer when Add Vendor button is clicked', () => {
      render(<VendorsView />);
      fireEvent.click(screen.getByRole('button', { name: /add vendor/i }));
      expect(screen.getByTestId('vendor-drawer')).toBeInTheDocument();
    });

    it('opens VendorDrawer from the EmptyState Add Vendor button', () => {
      mockUseVendors.mockReturnValue({ data: makeData(0) });
      render(<VendorsView />);
      fireEvent.click(screen.getByRole('button', { name: /add vendor/i }));
      expect(screen.getByTestId('vendor-drawer')).toBeInTheDocument();
    });
  });

  // -- Hook integration -----------------------------------------------------

  describe('hook integration', () => {
    it('calls useVendors with the current filter params', () => {
      const filters = { search: 'acme', page: 1, perPage: 20, status: [], sort: [] };
      mockUseQueryStates.mockReturnValue([filters, vi.fn()]);
      mockUseVendors.mockReturnValue({ data: makeData(1) });

      render(<VendorsView />);

      expect(mockUseVendors).toHaveBeenCalledWith(filters);
    });
  });
});
