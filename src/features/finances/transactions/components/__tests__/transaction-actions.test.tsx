// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionActions } from '../transaction-actions';
import { createTransactionWithDetails } from '@/lib/testing/factories/transaction.factory';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/hooks/use-query-string', () => ({
  useQueryString: () => ''
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  )
}));

// Render all dropdown items inline to avoid portal rendering issues
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => (
    <div>{children}</div>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='dropdown-content'>{children}</div>
  ),
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
    asChild
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    asChild?: boolean;
  }) =>
    asChild ? (
      <div onClick={onClick}>{children}</div>
    ) : (
      <button onClick={onClick}>{children}</button>
    ),
  DropdownMenuSeparator: () => <hr />
}));

// -- Tests ------------------------------------------------------------------

describe('TransactionActions', () => {
  const onDelete = vi.fn();
  const transaction = createTransactionWithDetails({ id: 'txn-123' });

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true
    });
  });

  it('renders the actions trigger button', () => {
    render(<TransactionActions transaction={transaction} onDelete={onDelete} />);
    expect(screen.getByRole('button', { name: 'Open actions menu' })).toBeInTheDocument();
  });

  it('renders all menu items', () => {
    render(<TransactionActions transaction={transaction} onDelete={onDelete} />);
    expect(screen.getByText('Copy transaction ID')).toBeInTheDocument();
    expect(screen.getByText('Edit transaction')).toBeInTheDocument();
    expect(screen.getByText('Delete transaction')).toBeInTheDocument();
  });

  it('copies transaction id to clipboard on copy click', () => {
    render(<TransactionActions transaction={transaction} onDelete={onDelete} />);
    fireEvent.click(screen.getByText('Copy transaction ID'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('txn-123');
  });

  it('calls onDelete with transaction id on delete click', () => {
    render(<TransactionActions transaction={transaction} onDelete={onDelete} />);
    fireEvent.click(screen.getByText('Delete transaction'));
    expect(onDelete).toHaveBeenCalledWith('txn-123');
  });

  it('renders edit link to the transaction detail page', () => {
    render(<TransactionActions transaction={transaction} onDelete={onDelete} />);
    const editLink = screen.getByRole('link', { name: /edit transaction/i });
    expect(editLink).toHaveAttribute('href', '/finances/transactions/txn-123');
  });
});
