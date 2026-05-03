// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { OrganizationActions } from '../organization-actions';
import { createOrganizationResponse } from '@/lib/testing/factories/organization.factory';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? <>{children}</> : <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='dropdown-content'>{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    onClick
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// -- Tests ------------------------------------------------------------------

describe('OrganizationActions', () => {
  const org = createOrganizationResponse({ id: 'org-1', name: 'Acme Florals', customersCount: 2 });
  const onDelete = vi.fn();
  const onEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trigger button with accessible label', () => {
    render(<OrganizationActions organization={org} onDelete={onDelete} onEdit={onEdit} />);
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
  });

  it('shows Edit Organization option', () => {
    render(<OrganizationActions organization={org} onDelete={onDelete} onEdit={onEdit} />);
    expect(screen.getByRole('button', { name: /edit organization/i })).toBeInTheDocument();
  });

  it('shows Delete Organization option', () => {
    render(<OrganizationActions organization={org} onDelete={onDelete} onEdit={onEdit} />);
    expect(screen.getByRole('button', { name: /delete organization/i })).toBeInTheDocument();
  });

  it('calls onEdit with the organisation when Edit is clicked', () => {
    render(<OrganizationActions organization={org} onDelete={onDelete} onEdit={onEdit} />);
    fireEvent.click(screen.getByRole('button', { name: /edit organization/i }));
    expect(onEdit).toHaveBeenCalledWith(org);
  });

  it('calls onDelete with id, name, and customersCount when Delete is clicked', () => {
    render(<OrganizationActions organization={org} onDelete={onDelete} onEdit={onEdit} />);
    fireEvent.click(screen.getByRole('button', { name: /delete organization/i }));
    expect(onDelete).toHaveBeenCalledWith('org-1', 'Acme Florals', 2);
  });

  it('does not call onEdit when onEdit prop is not provided', () => {
    render(<OrganizationActions organization={org} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /edit organization/i }));
    expect(onEdit).not.toHaveBeenCalled();
  });
});
