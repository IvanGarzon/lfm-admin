// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { UserForm } from '../user-form';
import type { UserDetail } from '@/features/users/types';

// -- Mocks ------------------------------------------------------------------

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => async (values: Record<string, unknown>) => ({ values, errors: {} })
}));

vi.mock('@/hooks/use-unsaved-changes', () => ({
  useUnsavedChanges: vi.fn()
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) => (
    <div aria-disabled={disabled}>{children}</div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  )
}));

const { mockUseSession } = vi.hoisted(() => ({ mockUseSession: vi.fn() }));

vi.mock('next-auth/react', () => ({ useSession: mockUseSession }));

// -- Helpers ----------------------------------------------------------------

function makeUser(overrides: Partial<UserDetail> = {}): UserDetail {
  return {
    id: 'user-1',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: null,
    role: 'USER',
    status: 'ACTIVE',
    isTwoFactorEnabled: false,
    loginNotificationsEnabled: false,
    lastLoginAt: null,
    username: null,
    title: null,
    bio: null,
    avatarUrl: null,
    addedBy: null,
    ...overrides
  };
}

function getForm() {
  const form = document.getElementById('form-rhf-user');
  if (!form) throw new Error('Form not found');
  return form;
}

// Admin session (has canManageUsers)
const adminSession = { user: { id: 'admin-1', role: 'ADMIN', tenantId: 't-1' } };
// Regular user session (no canManageUsers)
const userSession = { user: { id: 'user-99', role: 'USER', tenantId: 't-1' } };

// -- Tests ------------------------------------------------------------------

describe('UserForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSession.mockReturnValue({ data: adminSession });
  });

  describe('field rendering', () => {
    it('pre-fills first name from user data', () => {
      render(<UserForm user={makeUser({ firstName: 'Alice' })} onUpdate={vi.fn()} />);
      expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    });

    it('pre-fills last name from user data', () => {
      render(<UserForm user={makeUser({ lastName: 'Doe' })} onUpdate={vi.fn()} />);
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    });

    it('pre-fills email from user data', () => {
      render(<UserForm user={makeUser({ email: 'alice@example.com' })} onUpdate={vi.fn()} />);
      expect(screen.getByDisplayValue('alice@example.com')).toBeInTheDocument();
    });
  });

  describe('submission', () => {
    it('calls onUpdate on form submit', async () => {
      const onUpdate = vi.fn();
      render(<UserForm user={makeUser()} onUpdate={onUpdate} />);

      fireEvent.submit(getForm());

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledOnce();
      });
    });

    it('passes user id in onUpdate payload', async () => {
      const onUpdate = vi.fn();
      render(<UserForm user={makeUser({ id: 'cust-xyz' })} onUpdate={onUpdate} />);

      fireEvent.submit(getForm());

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: 'cust-xyz' }));
      });
    });
  });

  describe('status field permissions', () => {
    it('enables the status selector for admin users', () => {
      mockUseSession.mockReturnValue({ data: adminSession });
      render(<UserForm user={makeUser()} onUpdate={vi.fn()} />);

      // The Select mock renders a <div aria-disabled={disabled}> wrapping SelectTrigger/SelectContent.
      // The SelectValue mock renders the placeholder text inside that div.
      const selectWrapper = screen.getByText('Select status').closest('[aria-disabled]');
      expect(selectWrapper).toHaveAttribute('aria-disabled', 'false');
    });

    it('disables the status selector for non-admin users', () => {
      mockUseSession.mockReturnValue({ data: userSession });
      render(<UserForm user={makeUser()} onUpdate={vi.fn()} />);

      const selectWrapper = screen.getByText('Select status').closest('[aria-disabled]');
      expect(selectWrapper).toHaveAttribute('aria-disabled', 'true');
    });
  });
});
