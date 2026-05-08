// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { TransactionDrawerSkeleton } from '../transaction-drawer-skeleton';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/components/ui/drawer', () => ({
  DrawerHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerTitle: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DrawerDescription: () => <div />,
  DrawerBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// -- Tests ------------------------------------------------------------------

describe('TransactionDrawerSkeleton', () => {
  it('renders without crashing', () => {
    expect(() => render(<TransactionDrawerSkeleton />)).not.toThrow();
  });

  it('renders skeleton elements', () => {
    const { container } = render(<TransactionDrawerSkeleton />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
