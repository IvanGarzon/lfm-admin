// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { InvoiceStatusHistory } from '../invoice-status-history';
import type { InvoiceStatusHistoryItem } from '@/features/finances/invoices/types';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/features/finances/shared/components/status-history', () => ({
  StatusHistory: ({
    history,
    title,
    emptyMessage,
    renderStatusBadge
  }: {
    history: InvoiceStatusHistoryItem[];
    renderStatusBadge: (status: string) => React.ReactNode;
    title?: string;
    emptyMessage?: string;
  }) => (
    <div data-testid='status-history'>
      {title && <span data-testid='history-title'>{title}</span>}
      {history.length === 0 && emptyMessage && (
        <span data-testid='history-empty'>{emptyMessage}</span>
      )}
      {history.map((item) => (
        <div key={item.id} data-testid='history-item'>
          <span data-testid='history-status'>{renderStatusBadge(item.status)}</span>
        </div>
      ))}
    </div>
  )
}));

vi.mock('../invoice-status-badge', () => ({
  InvoiceStatusBadge: ({ status }: { status: string }) => (
    <span data-testid='invoice-status-badge' data-status={status}>
      {status}
    </span>
  )
}));

// -- Helpers ----------------------------------------------------------------

function makeHistoryItem(
  overrides: Partial<InvoiceStatusHistoryItem> = {}
): InvoiceStatusHistoryItem {
  return {
    id: 'history-1',
    status: 'PAID',
    previousStatus: 'PENDING',
    updatedAt: new Date('2024-03-15T10:30:00Z'),
    user: {
      id: 'user-1',
      firstName: 'Jane',
      lastName: 'Smith',
      avatarUrl: null
    },
    notes: null,
    ...overrides
  };
}

// -- Tests ------------------------------------------------------------------

describe('InvoiceStatusHistory', () => {
  // -- Rendering ------------------------------------------------------------

  describe('rendering', () => {
    it('renders the status history container', () => {
      render(<InvoiceStatusHistory history={[]} />);

      expect(screen.getByTestId('status-history')).toBeInTheDocument();
    });

    it('passes "Status History" as the title', () => {
      render(<InvoiceStatusHistory history={[]} />);

      expect(screen.getByTestId('history-title')).toHaveTextContent('Status History');
    });

    it('shows the empty message when history is empty', () => {
      render(<InvoiceStatusHistory history={[]} />);

      expect(screen.getByTestId('history-empty')).toHaveTextContent('No status history available.');
    });

    it('renders a history item for each entry', () => {
      const history = [
        makeHistoryItem({ id: 'h-1', status: 'PAID' }),
        makeHistoryItem({ id: 'h-2', status: 'OVERDUE' })
      ];

      render(<InvoiceStatusHistory history={history} />);

      expect(screen.getAllByTestId('history-item')).toHaveLength(2);
    });

    it('does not show the empty message when history has items', () => {
      render(<InvoiceStatusHistory history={[makeHistoryItem()]} />);

      expect(screen.queryByTestId('history-empty')).not.toBeInTheDocument();
    });
  });

  // -- Status badge rendering ------------------------------------------------

  describe('status badge rendering', () => {
    it('renders InvoiceStatusBadge for each history item status', () => {
      const history = [
        makeHistoryItem({ id: 'h-1', status: 'PAID' }),
        makeHistoryItem({ id: 'h-2', status: 'CANCELLED' })
      ];

      render(<InvoiceStatusHistory history={history} />);

      const badges = screen.getAllByTestId('invoice-status-badge');
      expect(badges).toHaveLength(2);
    });

    it('renders the correct status on each badge', () => {
      render(<InvoiceStatusHistory history={[makeHistoryItem({ status: 'OVERDUE' })]} />);

      expect(screen.getByTestId('invoice-status-badge')).toHaveAttribute('data-status', 'OVERDUE');
    });
  });
});
