// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { ResetPasswordForm } from '../reset-password-form';

// -- Mocks ------------------------------------------------------------------

const { mockResetPassword } = vi.hoisted(() => ({
  mockResetPassword: vi.fn()
}));

vi.mock('@/actions/users/mutations', () => ({
  resetPassword: mockResetPassword
}));

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => async (values: Record<string, unknown>) => ({ values, errors: {} })
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  )
}));

// -- Helpers ----------------------------------------------------------------

function getForm() {
  const form = document.querySelector('form');
  if (!form) {
    throw new Error('Form not found');
  }

  return form;
}

// -- Tests ------------------------------------------------------------------

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResetPassword.mockResolvedValue({ success: true });
  });

  describe('initial render', () => {
    it('shows the "Reset your password" heading', () => {
      render(<ResetPasswordForm token='test-token' email='user@example.com' />);
      expect(screen.getByRole('heading', { name: /reset your password/i })).toBeInTheDocument();
    });

    it('shows the target email address', () => {
      render(<ResetPasswordForm token='test-token' email='user@example.com' />);
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });

    it('renders the "Update password" submit button', () => {
      render(<ResetPasswordForm token='test-token' email='user@example.com' />);
      expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument();
    });

    it('renders password and confirm password inputs', () => {
      render(<ResetPasswordForm token='test-token' email='user@example.com' />);
      const inputs = screen.getAllByDisplayValue('');
      expect(inputs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('successful submission', () => {
    it('calls resetPassword with the token and new password on submit', async () => {
      render(<ResetPasswordForm token='abc-token' email='user@example.com' />);
      fireEvent.submit(getForm());
      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith('abc-token', expect.any(String));
      });
    });

    it('shows the success state after a successful reset', async () => {
      render(<ResetPasswordForm token='test-token' email='user@example.com' />);
      fireEvent.submit(getForm());
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /password updated/i })).toBeInTheDocument();
      });
    });

    it('shows a "Sign in" link in the success state', async () => {
      render(<ResetPasswordForm token='test-token' email='user@example.com' />);
      fireEvent.submit(getForm());
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/signin');
      });
    });
  });

  describe('failed submission', () => {
    it('shows the server error message when reset fails', async () => {
      mockResetPassword.mockResolvedValueOnce({
        success: false,
        error: 'This reset link is invalid or has expired.'
      });

      render(<ResetPasswordForm token='bad-token' email='user@example.com' />);
      fireEvent.submit(getForm());

      await waitFor(() => {
        expect(screen.getByText('This reset link is invalid or has expired.')).toBeInTheDocument();
      });
    });

    it('does not show the success state when reset fails', async () => {
      mockResetPassword.mockResolvedValueOnce({ success: false, error: 'Expired.' });

      render(<ResetPasswordForm token='bad-token' email='user@example.com' />);
      fireEvent.submit(getForm());

      await waitFor(() => {
        expect(
          screen.queryByRole('heading', { name: /password updated/i })
        ).not.toBeInTheDocument();
      });
    });
  });
});
