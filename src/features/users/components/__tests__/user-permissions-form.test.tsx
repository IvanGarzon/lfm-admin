// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { UserPermissionsForm } from '../user-permissions-form';
import type { UserDetail } from '@/features/users/types';

// -- Mocks ------------------------------------------------------------------

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => async (values: Record<string, unknown>) => ({ values, errors: {} })
}));

const { mockUseUserRoleChanges } = vi.hoisted(() => ({
  mockUseUserRoleChanges: vi.fn().mockReturnValue({ data: [], isLoading: false })
}));

vi.mock('@/features/users/hooks/use-user-queries', () => ({
  useUserRoleChanges: mockUseUserRoleChanges
}));

vi.mock('@/features/admin/users/components/user-role-badge', () => ({
  UserRoleBadge: ({ role }: { role: string }) => <span>{role}</span>
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({
    children,
    onValueChange,
    value
  }: {
    children: React.ReactNode;
    onValueChange?: (v: string) => void;
    value?: string;
  }) => (
    <div data-value={value}>
      {children}
      {/* expose a hidden input so tests can change the value */}
      <input
        data-testid='role-select-input'
        type='hidden'
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
      />
    </div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <button
      type='button'
      data-role={value}
      onClick={() => {
        const input = document.querySelector<HTMLInputElement>('[data-testid="role-select-input"]');
        if (input) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          )?.set;
          nativeInputValueSetter?.call(input, value);
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }}
    >
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, id }: { checked?: boolean; id?: string }) => (
    <input type='checkbox' id={id} checked={checked} readOnly />
  )
}));

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
  const form = document.getElementById('form-permissions');
  if (!form) throw new Error('Form not found');
  return form;
}

// -- Tests ------------------------------------------------------------------

describe('UserPermissionsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUserRoleChanges.mockReturnValue({ data: [], isLoading: false });
  });

  describe('rendering', () => {
    it('shows the "Role Assignment" heading', () => {
      render(<UserPermissionsForm user={makeUser()} onUpdate={vi.fn()} />);
      expect(screen.getByText('Role Assignment')).toBeInTheDocument();
    });

    it('shows the "Recent Access Changes" heading', () => {
      render(<UserPermissionsForm user={makeUser()} onUpdate={vi.fn()} />);
      expect(screen.getByText('Recent Access Changes')).toBeInTheDocument();
    });

    it('shows "No access changes recorded yet." when there are no changes', () => {
      render(<UserPermissionsForm user={makeUser()} onUpdate={vi.fn()} />);
      expect(screen.getByText('No access changes recorded yet.')).toBeInTheDocument();
    });

    it('shows access change entries when they exist', () => {
      mockUseUserRoleChanges.mockReturnValue({
        data: [
          {
            id: 'ac-1',
            message: 'Role changed to',
            toRole: 'ADMIN',
            changedByName: 'Super Admin',
            createdAt: new Date('2024-01-15')
          }
        ],
        isLoading: false
      });

      render(<UserPermissionsForm user={makeUser()} onUpdate={vi.fn()} />);

      expect(screen.getByText('Role changed to')).toBeInTheDocument();
      expect(screen.getByText('By Super Admin')).toBeInTheDocument();
    });
  });

  describe('submission', () => {
    it('calls onUpdate on form submit', async () => {
      const onUpdate = vi.fn();
      render(<UserPermissionsForm user={makeUser({ id: 'u-abc' })} onUpdate={onUpdate} />);

      fireEvent.submit(getForm());

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: 'u-abc' }));
      });
    });
  });
});
