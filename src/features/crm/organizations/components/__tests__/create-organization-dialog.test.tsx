// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { CreateOrganizationDialog } from '../create-organization-dialog';

// -- Mocks ------------------------------------------------------------------

const mockMutate = vi.fn();

const { mockUseCreateOrganization } = vi.hoisted(() => ({
  mockUseCreateOrganization: vi.fn()
}));

vi.mock('@/features/crm/organizations/hooks/use-organization-queries', () => ({
  useCreateOrganization: mockUseCreateOrganization
}));

vi.mock('@/features/crm/organizations/components/organization-form', () => ({
  OrganizationForm: ({
    onCreate,
    isCreating
  }: {
    onCreate?: (data: unknown) => void;
    isCreating?: boolean;
  }) => (
    <div data-testid='organization-form' data-creating={String(isCreating)}>
      <button onClick={() => onCreate?.({ name: 'New Org' })}>Submit</button>
    </div>
  )
}));

// -- Helpers ----------------------------------------------------------------

function renderDialog(props: Partial<Parameters<typeof CreateOrganizationDialog>[0]> = {}) {
  const defaults = {
    open: true,
    onOpenChange: vi.fn(),
    onSuccess: vi.fn()
  };
  return render(<CreateOrganizationDialog {...defaults} {...props} />);
}

// -- Tests ------------------------------------------------------------------

describe('CreateOrganizationDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCreateOrganization.mockReturnValue({ mutate: mockMutate, isPending: false });
  });

  it('renders when open is true', () => {
    renderDialog({ open: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    renderDialog({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog title', () => {
    renderDialog();
    expect(screen.getByRole('heading', { name: /add new organization/i })).toBeInTheDocument();
  });

  it('renders the OrganizationForm', () => {
    renderDialog();
    expect(screen.getByTestId('organization-form')).toBeInTheDocument();
  });

  it('passes isPending to OrganizationForm', () => {
    mockUseCreateOrganization.mockReturnValue({ mutate: mockMutate, isPending: true });
    renderDialog();
    expect(screen.getByTestId('organization-form')).toHaveAttribute('data-creating', 'true');
  });

  it('calls createOrganization.mutate when form is submitted', () => {
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(mockMutate).toHaveBeenCalledWith(
      { name: 'New Org' },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });
});
