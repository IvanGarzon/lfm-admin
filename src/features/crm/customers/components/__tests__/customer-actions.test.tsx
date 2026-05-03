// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { CustomerActions } from '../customer-actions';
import type { CustomerListItem } from '@/features/crm/customers/types';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/hooks/use-query-string', () => ({
  useQueryString: vi.fn().mockReturnValue('')
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  )
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
    className
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
  }) => (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  ),
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />
}));

// -- Helpers ----------------------------------------------------------------

function makeCustomer(overrides: Partial<CustomerListItem> = {}): CustomerListItem {
  return {
    id: 'customer-1',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: null,
    gender: 'FEMALE',
    status: 'ACTIVE',
    organizationId: null,
    organizationName: null,
    useOrganizationAddress: false,
    address: null,
    createdAt: new Date('2024-01-01'),
    deletedAt: null,
    invoicesCount: 0,
    quotesCount: 0,
    ...overrides
  };
}

// -- Tests ------------------------------------------------------------------

describe('CustomerActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dropdown trigger button', () => {
    render(<CustomerActions customer={makeCustomer()} onDelete={vi.fn()} />);
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
  });

  it('renders a "View customer" link pointing to the customer detail route', () => {
    const customer = makeCustomer({ id: 'cust-abc' });
    render(<CustomerActions customer={customer} onDelete={vi.fn()} />);
    expect(screen.getByRole('link', { name: /view customer/i })).toHaveAttribute(
      'href',
      '/crm/customers/cust-abc'
    );
  });

  it('calls onDelete with the customer id and full name when Delete is clicked', () => {
    const onDelete = vi.fn();
    const customer = makeCustomer({ id: 'c-99', firstName: 'Alice', lastName: 'Doe' });
    render(<CustomerActions customer={customer} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: /delete customer/i }));

    expect(onDelete).toHaveBeenCalledWith('c-99', 'Alice Doe');
  });

  it('appends query string to the view link when useQueryString returns a value', async () => {
    const mod = await import('@/hooks/use-query-string');
    (mod.useQueryString as ReturnType<typeof vi.fn>).mockReturnValueOnce('search=alice');

    const customer = makeCustomer({ id: 'cust-xyz' });
    render(<CustomerActions customer={customer} onDelete={vi.fn()} />);

    expect(screen.getByRole('link', { name: /view customer/i })).toHaveAttribute(
      'href',
      '/crm/customers/cust-xyz?search=alice'
    );
  });
});
