// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VendorStatusBadge } from '../vendor-status-badge';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/components/shared/status-badge', () => ({
  StatusBadge: ({
    status,
    config
  }: {
    status: string;
    config: Record<string, { label: string }>;
  }) => <span data-testid='status-badge'>{config[status]?.label}</span>
}));

// -- Tests ------------------------------------------------------------------

describe('VendorStatusBadge', () => {
  it('renders "Active" for ACTIVE status', () => {
    render(<VendorStatusBadge status='ACTIVE' />);
    expect(screen.getByTestId('status-badge')).toHaveTextContent('Active');
  });

  it('renders "Inactive" for INACTIVE status', () => {
    render(<VendorStatusBadge status='INACTIVE' />);
    expect(screen.getByTestId('status-badge')).toHaveTextContent('Inactive');
  });

  it('renders "Suspended" for SUSPENDED status', () => {
    render(<VendorStatusBadge status='SUSPENDED' />);
    expect(screen.getByTestId('status-badge')).toHaveTextContent('Suspended');
  });
});
