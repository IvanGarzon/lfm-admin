// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { SessionCard } from '../session-card';
import type { SessionWithUser } from '@/features/sessions/types';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/features/sessions/utils/session-icons', () => ({
  getDeviceIcon: vi
    .fn()
    .mockReturnValue(({ className }: { className?: string }) => (
      <svg className={className} data-testid='device-icon' />
    )),
  getOSDisplay: vi.fn().mockReturnValue({
    label: 'macOS',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    Icon: ({ className }: { className?: string }) => <svg className={className} />
  }),
  getBrowserDisplay: vi.fn().mockReturnValue({
    label: 'Chrome',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    Icon: ({ className }: { className?: string }) => <svg className={className} />
  }),
  getDeviceTypeDisplay: vi.fn().mockReturnValue({
    label: 'Desktop',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  })
}));

// -- Helpers ----------------------------------------------------------------

function makeSession(overrides: Partial<SessionWithUser> = {}): SessionWithUser {
  return {
    id: 'session-1',
    sessionToken: 'token-abc',
    userId: 'user-1',
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isActive: true,
    isCurrent: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastActiveAt: new Date('2024-06-01T10:00:00Z'),
    ipAddress: null,
    userAgent: null,
    deviceName: 'MacBook Pro',
    deviceType: 'desktop',
    deviceVendor: null,
    deviceModel: null,
    browserName: 'Chrome',
    browserVersion: null,
    osName: 'macOS',
    osVersion: null,
    country: 'Australia',
    region: 'Victoria',
    city: 'Melbourne',
    latitude: null,
    longitude: null,
    timezone: null,
    user: { firstName: 'Jane', lastName: 'Smith' },
    ...overrides
  };
}

// -- Tests ------------------------------------------------------------------

describe('SessionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('displays the device name', () => {
      render(<SessionCard session={makeSession()} onDelete={vi.fn()} onExtend={vi.fn()} />);
      expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
    });

    it('displays the location', () => {
      render(<SessionCard session={makeSession()} onDelete={vi.fn()} onExtend={vi.fn()} />);
      expect(screen.getByText('Melbourne, Victoria, Australia')).toBeInTheDocument();
    });

    it('shows "Location unknown" when no location data', () => {
      render(
        <SessionCard
          session={makeSession({ city: null, region: null, country: null })}
          onDelete={vi.fn()}
          onExtend={vi.fn()}
        />
      );
      expect(screen.getByText('Location unknown')).toBeInTheDocument();
    });

    it('shows "Current Session" badge for current session', () => {
      render(
        <SessionCard
          session={makeSession({ isCurrent: true })}
          onDelete={vi.fn()}
          onExtend={vi.fn()}
        />
      );
      expect(screen.getByText('Current Session')).toBeInTheDocument();
    });

    it('does not show "Current Session" badge for non-current session', () => {
      render(
        <SessionCard
          session={makeSession({ isCurrent: false })}
          onDelete={vi.fn()}
          onExtend={vi.fn()}
        />
      );
      expect(screen.queryByText('Current Session')).not.toBeInTheDocument();
    });
  });

  describe('actions', () => {
    it('renders the "Extend" button', () => {
      render(<SessionCard session={makeSession()} onDelete={vi.fn()} onExtend={vi.fn()} />);
      expect(screen.getByRole('button', { name: /extend/i })).toBeInTheDocument();
    });

    it('calls onExtend with the session id when "Extend" is clicked', () => {
      const onExtend = vi.fn();
      render(
        <SessionCard
          session={makeSession({ id: 'sess-99' })}
          onDelete={vi.fn()}
          onExtend={onExtend}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /extend/i }));
      expect(onExtend).toHaveBeenCalledWith('sess-99');
    });

    it('renders the "Revoke" button for non-current sessions', () => {
      render(
        <SessionCard
          session={makeSession({ isCurrent: false })}
          onDelete={vi.fn()}
          onExtend={vi.fn()}
        />
      );
      expect(screen.getByRole('button', { name: /revoke/i })).toBeInTheDocument();
    });

    it('does not render "Revoke" for the current session', () => {
      render(
        <SessionCard
          session={makeSession({ isCurrent: true })}
          onDelete={vi.fn()}
          onExtend={vi.fn()}
        />
      );
      expect(screen.queryByRole('button', { name: /revoke/i })).not.toBeInTheDocument();
    });

    it('calls onDelete with the full session when "Revoke" is clicked', () => {
      const onDelete = vi.fn();
      const session = makeSession({ id: 'sess-42', isCurrent: false });
      render(<SessionCard session={session} onDelete={onDelete} onExtend={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: /revoke/i }));
      expect(onDelete).toHaveBeenCalledWith(session);
    });
  });
});
