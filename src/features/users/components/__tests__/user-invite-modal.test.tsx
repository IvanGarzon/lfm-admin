// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { UserInviteModal } from '../user-invite-modal';
import type { InviteUserInput } from '@/schemas/users';

// -- Mocks ------------------------------------------------------------------

const { mockMutate, mockUseInviteUser } = vi.hoisted(() => {
  const mockMutate = vi.fn();
  const mockUseInviteUser = vi.fn(() => ({
    mutate: mockMutate,
    isPending: false,
    isError: false,
    error: null
  }));
  return { mockMutate, mockUseInviteUser };
});

vi.mock('@/features/users/hooks/use-user-queries', () => ({
  useInviteUser: mockUseInviteUser
}));

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => async (values: Record<string, unknown>) => ({ values, errors: {} })
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({
    open,
    children
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
  }) => (open ? <div role='dialog'>{children}</div> : null),
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  )
}));

// -- Helpers ----------------------------------------------------------------

function getForm() {
  const form = document.querySelector('form');
  if (!form) throw new Error('Form not found');
  return form;
}

// -- Tests ------------------------------------------------------------------

describe('UserInviteModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseInviteUser.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null
    });
  });

  describe('when open', () => {
    it('renders the dialog', () => {
      render(<UserInviteModal open={true} onOpenChange={vi.fn()} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('shows the "Invite User" title', () => {
      render(<UserInviteModal open={true} onOpenChange={vi.fn()} />);
      expect(screen.getByRole('heading', { name: 'Invite User' })).toBeInTheDocument();
    });

    it('renders the email input', () => {
      render(<UserInviteModal open={true} onOpenChange={vi.fn()} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders the "Send Invitation" submit button', () => {
      render(<UserInviteModal open={true} onOpenChange={vi.fn()} />);
      expect(screen.getByRole('button', { name: /send invitation/i })).toBeInTheDocument();
    });

    it('disables buttons when isPending', () => {
      mockUseInviteUser.mockReturnValue({
        mutate: mockMutate,
        isPending: true,
        isError: false,
        error: null
      });
      render(<UserInviteModal open={true} onOpenChange={vi.fn()} />);
      expect(screen.getByRole('button', { name: /send invitation/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });
  });

  describe('when closed', () => {
    it('does not render the dialog', () => {
      render(<UserInviteModal open={false} onOpenChange={vi.fn()} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Cancel button', () => {
    it('calls onOpenChange(false) when Cancel is clicked', () => {
      const onOpenChange = vi.fn();
      render(<UserInviteModal open={true} onOpenChange={onOpenChange} />);
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('form submission', () => {
    it('calls inviteUser.mutate with form data on submit', async () => {
      render(<UserInviteModal open={true} onOpenChange={vi.fn()} />);
      fireEvent.submit(getForm());
      await vi.waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({ email: '', role: 'USER' }),
          expect.any(Object)
        );
      });
    });

    it('calls onOpenChange(false) on successful invite', async () => {
      const onOpenChange = vi.fn();
      mockMutate.mockImplementation(
        (_data: InviteUserInput, { onSuccess }: { onSuccess: () => void }) => {
          onSuccess();
        }
      );
      render(<UserInviteModal open={true} onOpenChange={onOpenChange} />);
      fireEvent.submit(getForm());
      await vi.waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });
});
