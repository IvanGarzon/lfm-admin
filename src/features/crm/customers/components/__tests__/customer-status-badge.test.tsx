// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { CustomerStatusBadge } from '../customer-status-badge';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/components/shared/status-badge', () => ({
  StatusBadge: ({
    config,
    status
  }: {
    config: Record<string, { label: string }>;
    status: string;
  }) => <span>{config[status].label}</span>
}));

// -- Tests ------------------------------------------------------------------

describe('CustomerStatusBadge', () => {
  it('renders "Active" for ACTIVE status', () => {
    render(<CustomerStatusBadge status='ACTIVE' />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders "Inactive" for INACTIVE status', () => {
    render(<CustomerStatusBadge status='INACTIVE' />);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('renders "Deleted" for DELETED status', () => {
    render(<CustomerStatusBadge status='DELETED' />);
    expect(screen.getByText('Deleted')).toBeInTheDocument();
  });
});
