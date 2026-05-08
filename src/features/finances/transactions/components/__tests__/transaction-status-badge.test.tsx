// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransactionStatusBadge } from '../transaction-status-badge';

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

describe('TransactionStatusBadge', () => {
  it('renders "Pending" for PENDING status', () => {
    render(<TransactionStatusBadge status='PENDING' />);
    expect(screen.getByTestId('status-badge')).toHaveTextContent('Pending');
  });

  it('renders "Completed" for COMPLETED status', () => {
    render(<TransactionStatusBadge status='COMPLETED' />);
    expect(screen.getByTestId('status-badge')).toHaveTextContent('Completed');
  });

  it('renders "Cancelled" for CANCELLED status', () => {
    render(<TransactionStatusBadge status='CANCELLED' />);
    expect(screen.getByTestId('status-badge')).toHaveTextContent('Cancelled');
  });
});
