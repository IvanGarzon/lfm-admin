// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { InvoiceDrawerSkeleton } from '../invoice-drawer-skeleton';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid='skeleton' className={className} />
  )
}));

vi.mock('@/components/ui/box', () => ({
  Box: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  )
}));

vi.mock('@/components/ui/drawer', () => ({
  DrawerHeader: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div data-testid='drawer-header' className={className}>
      {children}
    </div>
  ),
  DrawerTitle: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div data-testid='drawer-title' className={className}>
      {children}
    </div>
  ),
  DrawerDescription: ({
    children,
    className
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid='drawer-description' className={className}>
      {children}
    </div>
  ),
  DrawerBody: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div data-testid='drawer-body' className={className}>
      {children}
    </div>
  )
}));

// -- Tests ------------------------------------------------------------------

describe('InvoiceDrawerSkeleton', () => {
  // -- Rendering ------------------------------------------------------------

  describe('rendering', () => {
    it('renders the drawer header', () => {
      render(<InvoiceDrawerSkeleton />);

      expect(screen.getByTestId('drawer-header')).toBeInTheDocument();
    });

    it('renders the drawer body', () => {
      render(<InvoiceDrawerSkeleton />);

      expect(screen.getByTestId('drawer-body')).toBeInTheDocument();
    });

    it('renders a loading description for screen readers', () => {
      render(<InvoiceDrawerSkeleton />);

      expect(screen.getByTestId('drawer-description')).toHaveTextContent('Loading invoice details');
    });

    it('renders skeleton elements', () => {
      render(<InvoiceDrawerSkeleton />);

      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders four skeleton groups in the body', () => {
      render(<InvoiceDrawerSkeleton />);

      // Each group has 3 skeletons (h-8, h-4, then 3 × h-4 = 5 per group), 4 groups = 20 total
      // Plus 1 in the header title = 21
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons).toHaveLength(21);
    });
  });
});
