// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { DeleteSessionDialog, RevokeAllSessionsDialog } from '../delete-session-dialog';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({
    open,
    children
  }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    children: React.ReactNode;
  }) => (open ? <div role='alertdialog'>{children}</div> : null),
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogCancel: ({
    children,
    disabled,
    onClick
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    onClick?: () => void;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  AlertDialogAction: ({
    children,
    disabled,
    onClick
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    onClick?: (e: React.MouseEvent) => void;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}));

// -- Tests ------------------------------------------------------------------

describe('DeleteSessionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    render(<DeleteSessionDialog open={false} onOpenChange={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('shows "Sign Out Session?" title for non-admin actions', () => {
    render(
      <DeleteSessionDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isAdminAction={false}
      />
    );
    expect(screen.getByRole('heading', { name: /sign out session/i })).toBeInTheDocument();
  });

  it('shows "Revoke Session?" title for admin actions', () => {
    render(
      <DeleteSessionDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isAdminAction={true}
      />
    );
    expect(screen.getByRole('heading', { name: /revoke session/i })).toBeInTheDocument();
  });

  it('includes the device name in the description', () => {
    render(
      <DeleteSessionDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        deviceName='MacBook Pro'
      />
    );
    expect(screen.getByText(/macbook pro/i)).toBeInTheDocument();
  });

  it('calls onConfirm when the action button is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <DeleteSessionDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isAdminAction={true}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /revoke/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('disables buttons when isPending', () => {
    render(
      <DeleteSessionDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={true}
      />
    );
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });
});

describe('RevokeAllSessionsDialog', () => {
  it('shows "Revoke all sessions?" title', () => {
    render(<RevokeAllSessionsDialog open={true} onOpenChange={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /revoke all sessions/i })).toBeInTheDocument();
  });

  it('shows admin-specific description when isAdminAction=true', () => {
    render(
      <RevokeAllSessionsDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isAdminAction={true}
      />
    );
    expect(screen.getByText(/signed out on all devices/i)).toBeInTheDocument();
  });

  it('shows self-action description when isAdminAction=false', () => {
    render(
      <RevokeAllSessionsDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isAdminAction={false}
      />
    );
    expect(screen.getByText(/current session will remain active/i)).toBeInTheDocument();
  });

  it('calls onConfirm when "Revoke all" is clicked', () => {
    const onConfirm = vi.fn();
    render(<RevokeAllSessionsDialog open={true} onOpenChange={vi.fn()} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: /revoke all/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
