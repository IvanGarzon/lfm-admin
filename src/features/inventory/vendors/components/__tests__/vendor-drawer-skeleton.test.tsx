// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VendorDrawerSkeleton } from '../vendor-drawer-skeleton';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/components/ui/drawer', () => ({
  DrawerHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid='skeleton' className={className} />
  )
}));

// -- Tests ------------------------------------------------------------------

describe('VendorDrawerSkeleton', () => {
  it('renders the "Vendor Details" title', () => {
    render(<VendorDrawerSkeleton />);
    expect(screen.getByText('Vendor Details')).toBeInTheDocument();
  });

  it('renders skeleton placeholders', () => {
    render(<VendorDrawerSkeleton />);
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });
});
