// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VendorDrawer } from '../vendor-drawer';
import { createVendorWithDetails } from '@/lib/testing/factories/vendor.factory';

// -- Mocks ------------------------------------------------------------------

const { mockRouterPush, mockPathname } = vi.hoisted(() => ({
  mockRouterPush: vi.fn(),
  mockPathname: { current: '/inventory/vendors' }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  usePathname: () => mockPathname.current
}));

vi.mock('@/hooks/use-query-string', () => ({
  useQueryString: () => ''
}));

vi.mock('@/hooks/use-unsaved-changes', () => ({
  useUnsavedChanges: () => undefined
}));

const { mockUseVendor, mockCreateMutate, mockUpdateMutate } = vi.hoisted(() => ({
  mockUseVendor: vi.fn(),
  mockCreateMutate: vi.fn(),
  mockUpdateMutate: vi.fn()
}));

vi.mock('@/features/inventory/vendors/hooks/use-vendor-queries', () => ({
  useVendor: (...args: unknown[]) => mockUseVendor(...args),
  useCreateVendor: () => ({ mutate: mockCreateMutate, isPending: false }),
  useUpdateVendor: () => ({ mutate: mockUpdateMutate, isPending: false })
}));

vi.mock('../vendor-form', () => ({
  VendorForm: () => <div data-testid='vendor-form' />
}));

vi.mock('../vendor-drawer-skeleton', () => ({
  VendorDrawerSkeleton: () => <div data-testid='vendor-drawer-skeleton' />
}));

// -- Tests ------------------------------------------------------------------

describe('VendorDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.current = '/inventory/vendors';
    mockUseVendor.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null
    });
  });

  // -- Create mode ----------------------------------------------------------

  describe('create mode (no id)', () => {
    it('shows "Add Vendor" title when open', () => {
      render(<VendorDrawer open={true} />);
      expect(screen.getByText('Add Vendor')).toBeInTheDocument();
    });

    it('renders the vendor form', () => {
      render(<VendorDrawer open={true} />);
      expect(screen.getByTestId('vendor-form')).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      render(<VendorDrawer open={false} />);
      expect(screen.queryByText('Add Vendor')).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<VendorDrawer open={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  // -- Edit mode ------------------------------------------------------------

  describe('edit mode (with id)', () => {
    beforeEach(() => {
      mockPathname.current = '/inventory/vendors/vendor-1';
    });

    it('shows "Edit Vendor" title when vendor is loaded', () => {
      mockUseVendor.mockReturnValue({
        data: createVendorWithDetails({ id: 'vendor-1' }),
        isLoading: false,
        isError: false,
        error: null
      });
      render(<VendorDrawer id='vendor-1' />);
      expect(screen.getByText('Edit Vendor')).toBeInTheDocument();
    });

    it('shows skeleton while loading', () => {
      mockUseVendor.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null
      });
      render(<VendorDrawer id='vendor-1' />);
      expect(screen.getByTestId('vendor-drawer-skeleton')).toBeInTheDocument();
    });

    it('renders the vendor form when data is loaded', () => {
      mockUseVendor.mockReturnValue({
        data: createVendorWithDetails({ id: 'vendor-1' }),
        isLoading: false,
        isError: false,
        error: null
      });
      render(<VendorDrawer id='vendor-1' />);
      expect(screen.getByTestId('vendor-form')).toBeInTheDocument();
    });
  });

  // -- Error state ----------------------------------------------------------

  it('shows error message when vendor fails to load', () => {
    mockPathname.current = '/inventory/vendors/bad-id';
    mockUseVendor.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { message: 'Not found' }
    });
    render(<VendorDrawer id='bad-id' />);
    expect(screen.getByText(/could not load vendor/i)).toBeInTheDocument();
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });
});
