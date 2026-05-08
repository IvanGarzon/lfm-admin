// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VendorActions } from '../vendor-actions';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/features/inventory/vendors/hooks/use-vendor-href', () => ({
  useVendorHref: (id: string) => `/inventory/vendors/${id}`
}));

vi.mock('@/features/inventory/vendors/context/vendor-action-context', () => ({
  useVendorActions: () => ({ openDelete: vi.fn() })
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  )
}));

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

describe('VendorActions', () => {
  const onDelete = vi.fn();
  const vendor = { id: 'vendor-123', vendorCode: 'VEN-001', name: 'Acme Florals' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the actions trigger button', () => {
    render(<VendorActions vendor={vendor} onDelete={onDelete} />);
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
  });

  it('renders all menu items', () => {
    render(<VendorActions vendor={vendor} onDelete={onDelete} />);
    expect(screen.getByText(/edit vendor/i)).toBeInTheDocument();
    expect(screen.getByText(/delete vendor/i)).toBeInTheDocument();
  });

  it('renders edit link pointing to the vendor detail page', () => {
    render(<VendorActions vendor={vendor} onDelete={onDelete} />);
    const editLink = screen.getByRole('link', { name: /edit vendor/i });
    expect(editLink).toHaveAttribute('href', '/inventory/vendors/vendor-123');
  });

  it('calls onDelete with vendor id, code, and name on delete click', () => {
    render(<VendorActions vendor={vendor} onDelete={onDelete} />);
    fireEvent.click(screen.getByText(/delete vendor/i));
    expect(onDelete).toHaveBeenCalledWith('vendor-123', 'VEN-001', 'Acme Florals');
  });
});
