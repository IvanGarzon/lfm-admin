// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { UserSecurityForm } from '../user-security-form';
import type { UserDetail } from '@/features/users/types';

// -- Mocks ------------------------------------------------------------------

const { mockUseSession } = vi.hoisted(() => ({ mockUseSession: vi.fn() }));
vi.mock('next-auth/react', () => ({ useSession: mockUseSession }));

const { mockUseChangePassword, mockUseSendPasswordResetEmail, mockUseUpdateUserSecurity } =
  vi.hoisted(() => ({
    mockUseChangePassword: vi.fn(),
    mockUseSendPasswordResetEmail: vi.fn(),
    mockUseUpdateUserSecurity: vi.fn()
  }));

vi.mock('@/features/users/hooks/use-user-queries', () => ({
  useChangePassword: mockUseChangePassword,
  useSendPasswordResetEmail: mockUseSendPasswordResetEmail,
  useUpdateUserSecurity: mockUseUpdateUserSecurity
}));

vi.mock('@/features/users/hooks/use-sessions', () => ({
  useSessions: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useDeleteSession: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useDeleteOtherSessions: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useExtendSession: vi.fn().mockReturnValue({ mutate: vi.fn() }),
  useUserSessions: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useAdminRevokeUserSession: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useAdminExtendUserSession: vi.fn().mockReturnValue({ mutate: vi.fn() }),
  useAdminRevokeAllUserSessions: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false })
}));

vi.mock('@/features/users/components/sessions/session-card', () => ({
  SessionCard: () => null
}));

vi.mock('@/features/users/components/sessions/session-card-skeleton', () => ({
  SessionCardSkeleton: () => null
}));

vi.mock('@/features/users/components/sessions/delete-session-dialog', () => ({
  DeleteSessionDialog: () => null,
  RevokeAllSessionsDialog: () => null
}));

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => async (values: Record<string, unknown>) => ({ values, errors: {} })
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

const mockMutateSend = vi.fn();
const mockMutateUpdate = vi.fn();

// -- Tests ------------------------------------------------------------------

describe('UserSecurityForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseChangePassword.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseSendPasswordResetEmail.mockReturnValue({
      mutate: mockMutateSend,
      isPending: false
    });
    mockUseUpdateUserSecurity.mockReturnValue({
      mutate: mockMutateUpdate,
      isPending: false
    });
  });

  describe('own profile view', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-1', role: 'USER', tenantId: 't-1' } }
      });
    });

    it('shows "Change Password" heading for own profile', () => {
      render(<UserSecurityForm user={makeUser({ id: 'user-1' })} />);
      expect(screen.getByText('Change Password')).toBeInTheDocument();
    });

    it('renders "Update password" submit button', () => {
      render(<UserSecurityForm user={makeUser({ id: 'user-1' })} />);
      expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument();
    });
  });

  describe('admin viewing another user', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'admin-99', role: 'ADMIN', tenantId: 't-1' } }
      });
    });

    it('shows "Reset Password" heading for admin', () => {
      render(<UserSecurityForm user={makeUser({ id: 'user-1' })} />);
      expect(screen.getByText('Reset Password')).toBeInTheDocument();
    });

    it('shows "Send reset email" button', () => {
      render(<UserSecurityForm user={makeUser({ id: 'user-1' })} />);
      expect(screen.getByRole('button', { name: /send reset email/i })).toBeInTheDocument();
    });

    it('calls sendPasswordResetEmail.mutate when "Send reset email" is clicked', () => {
      render(<UserSecurityForm user={makeUser({ id: 'user-1' })} />);
      fireEvent.click(screen.getByRole('button', { name: /send reset email/i }));
      expect(mockMutateSend).toHaveBeenCalledWith('user-1');
    });

    it('disables "Send reset email" when user has no email', () => {
      render(<UserSecurityForm user={makeUser({ id: 'user-1', email: null })} />);
      expect(screen.getByRole('button', { name: /send reset email/i })).toBeDisabled();
    });
  });

  describe('security settings', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'admin-99', role: 'ADMIN', tenantId: 't-1' } }
      });
    });

    it('shows "Two-Factor Authentication" toggle', () => {
      render(<UserSecurityForm user={makeUser()} />);
      expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
    });

    it('shows "Enable" when 2FA is disabled', () => {
      render(<UserSecurityForm user={makeUser({ isTwoFactorEnabled: false })} />);
      const enableBtns = screen.getAllByRole('button', { name: /^enable$/i });
      expect(enableBtns.length).toBeGreaterThan(0);
    });

    it('shows "Disable" when 2FA is enabled', () => {
      render(<UserSecurityForm user={makeUser({ isTwoFactorEnabled: true })} />);
      expect(screen.getByRole('button', { name: /^disable$/i })).toBeInTheDocument();
    });

    it('calls updateSecurity when 2FA toggle is clicked', () => {
      render(<UserSecurityForm user={makeUser({ id: 'user-1', isTwoFactorEnabled: false })} />);
      // First "Enable" button is the 2FA toggle
      fireEvent.click(screen.getAllByRole('button', { name: /^enable$/i })[0]);
      expect(mockMutateUpdate).toHaveBeenCalledWith({
        id: 'user-1',
        isTwoFactorEnabled: true
      });
    });

    it('shows "Login Notifications" toggle', () => {
      render(<UserSecurityForm user={makeUser()} />);
      expect(screen.getByText('Login Notifications')).toBeInTheDocument();
    });
  });

  describe('active sessions', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'admin-99', role: 'ADMIN', tenantId: 't-1' } }
      });
    });

    it('shows "Active Sessions" heading', () => {
      render(<UserSecurityForm user={makeUser()} />);
      expect(screen.getByText('Active Sessions')).toBeInTheDocument();
    });

    it('shows "No active sessions." when there are none', () => {
      render(<UserSecurityForm user={makeUser()} />);
      expect(screen.getByText('No active sessions.')).toBeInTheDocument();
    });
  });
});
