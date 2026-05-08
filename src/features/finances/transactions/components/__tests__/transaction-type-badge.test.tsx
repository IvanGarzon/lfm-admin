// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransactionTypeBadge } from '../transaction-type-badge';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/components/shared/status-badge', () => ({
  StatusBadge: ({
    status,
    config
  }: {
    status: string;
    config: Record<string, { label: string }>;
  }) => <span data-testid='type-badge'>{config[status]?.label}</span>
}));

// -- Tests ------------------------------------------------------------------

describe('TransactionTypeBadge', () => {
  it('renders "Income" for INCOME type', () => {
    render(<TransactionTypeBadge type='INCOME' />);
    expect(screen.getByTestId('type-badge')).toHaveTextContent('Income');
  });

  it('renders "Expense" for EXPENSE type', () => {
    render(<TransactionTypeBadge type='EXPENSE' />);
    expect(screen.getByTestId('type-badge')).toHaveTextContent('Expense');
  });
});
