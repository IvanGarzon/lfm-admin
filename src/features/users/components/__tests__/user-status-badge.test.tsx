// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { UserStatusBadge } from '../user-status-badge';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/components/shared/status-badge', () => ({
  StatusBadge: ({
    status,
    config
  }: {
    status: string;
    config: Record<string, { label: string }>;
  }) => <span>{config[status]?.label ?? status}</span>
}));

// -- Tests ------------------------------------------------------------------

describe('UserStatusBadge', () => {
  it('renders "Active" for ACTIVE status', () => {
    render(<UserStatusBadge status='ACTIVE' />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders "Invited" for INVITED status', () => {
    render(<UserStatusBadge status='INVITED' />);
    expect(screen.getByText('Invited')).toBeInTheDocument();
  });

  it('renders "Suspended" for SUSPENDED status', () => {
    render(<UserStatusBadge status='SUSPENDED' />);
    expect(screen.getByText('Suspended')).toBeInTheDocument();
  });
});
