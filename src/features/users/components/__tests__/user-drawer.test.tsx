// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { UserDrawer } from '../user-drawer';

// -- Mocks ------------------------------------------------------------------

const mockRouterPush = vi.fn();
const mockMutateUpdate = vi.fn();
const mockMutateRole = vi.fn();

const {
  mockUseUser,
  mockUseUpdateUser,
  mockUseUpdateUserRole,
  mockUseUploadUserAvatar,
  mockUseSession,
  mockUsePathname
} = vi.hoisted(() => ({
  mockUseUser: vi.fn(),
  mockUseUpdateUser: vi.fn(),
  mockUseUpdateUserRole: vi.fn(),
  mockUseUploadUserAvatar: vi.fn(),
  mockUseSession: vi.fn(),
  mockUsePathname: vi.fn()
}));

vi.mock('@/features/users/hooks/use-user-queries', () => ({
  useUser: mockUseUser,
  useUpdateUser: mockUseUpdateUser,
  useUpdateUserRole: mockUseUpdateUserRole,
  useUploadUserAvatar: mockUseUploadUserAvatar
}));

vi.mock('next-auth/react', () => ({
  useSession: mockUseSession
}));

vi.mock('next/navigation', () => ({
  usePathname: mockUsePathname,
  useRouter: () => ({ push: mockRouterPush })
}));

vi.mock('@/hooks/use-query-string', () => ({
  useQueryString: () => ''
}));

vi.mock('@/filters/users/users-filters', () => ({
  searchParams: { search: { defaultValue: '' } },
  userSearchParamsDefaults: {}
}));

vi.mock('@/components/ui/drawer', () => ({
  Drawer: ({
    open,
    children
  }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    children: React.ReactNode;
  }) => (open ? <div data-testid='drawer'>{children}</div> : null),
  DrawerContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DrawerDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DrawerBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({
    children,
    value,
    onValueChange
  }: {
    children: React.ReactNode;
    value: string;
    onValueChange: (v: string) => void;
  }) => (
    <div data-testid='tabs' data-value={value} onClick={() => onValueChange?.(value)}>
      {children}
    </div>
  ),
  TabsList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({
    children,
    value,
    onClick
  }: {
    children: React.ReactNode;
    value: string;
    onClick?: () => void;
  }) => (
    <button data-testid={`tab-${value}`} onClick={onClick}>
      {children}
    </button>
  ),
  TabsContent: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  )
}));

vi.mock('@/features/users/components/user-form', () => ({
  UserForm: () => <form id='form-rhf-user' data-testid='user-form' />
}));

vi.mock('@/features/users/components/user-permissions-form', () => ({
  UserPermissionsForm: () => <form id='form-permissions' data-testid='user-permissions-form' />
}));

vi.mock('@/features/users/components/user-security-form', () => ({
  UserSecurityForm: () => <div data-testid='user-security-form' />
}));

vi.mock('@/features/users/components/user-status-badge', () => ({
  UserStatusBadge: ({ status }: { status: string }) => (
    <span data-testid='user-status-badge'>{status}</span>
  )
}));

vi.mock('@/features/admin/users/components/user-role-badge', () => ({
  UserRoleBadge: ({ role }: { role: string }) => <span data-testid='user-role-badge'>{role}</span>
}));

vi.mock('@/components/shared/user-avatar', () => ({
  UserAvatar: ({ user }: { user: { name: string; image: string | null } }) => (
    <div data-testid='user-avatar'>{user.name}</div>
  )
}));

vi.mock('@/components/ui/visually-hidden', () => ({
  VisuallyHidden: ({ children }: { children: React.ReactNode }) => (
    <span className='sr-only'>{children}</span>
  )
}));

// -- Helpers ----------------------------------------------------------------

import { createUserDetail } from '@/lib/testing/factories/user.factory';

const USER_ID = 'user-abc';

function makeDefaultMocks() {
  mockUseUpdateUser.mockReturnValue({ mutate: mockMutateUpdate, isPending: false });
  mockUseUpdateUserRole.mockReturnValue({ mutate: mockMutateRole, isPending: false });
  mockUseUploadUserAvatar.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mockUseSession.mockReturnValue({ data: { user: { id: 'other-user' } } });
  mockUsePathname.mockReturnValue(`/users/${USER_ID}/details`);
}

// -- Tests ------------------------------------------------------------------

describe('UserDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    makeDefaultMocks();
  });

  // -- Loading state --------------------------------------------------------

  describe('loading state', () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        isError: false
      });
    });

    it('renders loading text when data is being fetched', () => {
      render(<UserDrawer id={USER_ID} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders "User Details" heading during load', () => {
      render(<UserDrawer id={USER_ID} />);
      expect(screen.getByRole('heading', { name: 'User Details' })).toBeInTheDocument();
    });
  });

  // -- Error state ----------------------------------------------------------

  describe('error state', () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Not found'),
        isError: true
      });
    });

    it('renders error heading', () => {
      render(<UserDrawer id={USER_ID} />);
      expect(screen.getByRole('heading', { name: 'Error' })).toBeInTheDocument();
    });

    it('renders error message', () => {
      render(<UserDrawer id={USER_ID} />);
      expect(screen.getByText(/Not found/)).toBeInTheDocument();
    });
  });

  // -- Loaded state ---------------------------------------------------------

  describe('loaded state', () => {
    const user = createUserDetail({
      id: USER_ID,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      title: 'Senior Stylist',
      role: 'MANAGER',
      status: 'ACTIVE'
    });

    beforeEach(() => {
      mockUseUser.mockReturnValue({ data: user, isLoading: false, error: null, isError: false });
    });

    it('renders the user full name as heading', () => {
      render(<UserDrawer id={USER_ID} />);
      expect(screen.getByRole('heading', { name: 'Jane Doe' })).toBeInTheDocument();
    });

    it('renders the user title', () => {
      render(<UserDrawer id={USER_ID} />);
      expect(screen.getByText('Senior Stylist')).toBeInTheDocument();
    });

    it('renders the user email', () => {
      render(<UserDrawer id={USER_ID} />);
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('renders role badge', () => {
      render(<UserDrawer id={USER_ID} />);
      expect(screen.getByTestId('user-role-badge')).toBeInTheDocument();
    });

    it('renders status badge', () => {
      render(<UserDrawer id={USER_ID} />);
      expect(screen.getByTestId('user-status-badge')).toBeInTheDocument();
    });

    it('renders all three tab content areas', () => {
      render(<UserDrawer id={USER_ID} />);
      expect(screen.getByTestId('tab-content-details')).toBeInTheDocument();
      expect(screen.getByTestId('tab-content-permissions')).toBeInTheDocument();
      expect(screen.getByTestId('tab-content-security')).toBeInTheDocument();
    });

    it('renders UserForm in details tab', () => {
      render(<UserDrawer id={USER_ID} />);
      expect(screen.getByTestId('user-form')).toBeInTheDocument();
    });

    it('renders UserPermissionsForm in permissions tab', () => {
      render(<UserDrawer id={USER_ID} />);
      expect(screen.getByTestId('user-permissions-form')).toBeInTheDocument();
    });

    it('renders UserSecurityForm in security tab', () => {
      render(<UserDrawer id={USER_ID} />);
      expect(screen.getByTestId('user-security-form')).toBeInTheDocument();
    });

    it('renders Update user button', () => {
      render(<UserDrawer id={USER_ID} />);
      expect(screen.getByRole('button', { name: /update user/i })).toBeInTheDocument();
    });

    it('Update user button is disabled when no unsaved changes', () => {
      render(<UserDrawer id={USER_ID} />);
      expect(screen.getByRole('button', { name: /update user/i })).toBeDisabled();
    });
  });

  // -- Open / closed state --------------------------------------------------

  describe('open state via URL', () => {
    const user = createUserDetail({ id: USER_ID });

    it('renders drawer when pathname includes the user id', () => {
      mockUseUser.mockReturnValue({ data: user, isLoading: false, error: null, isError: false });
      mockUsePathname.mockReturnValue(`/users/${USER_ID}/details`);
      render(<UserDrawer id={USER_ID} />);
      expect(screen.getByTestId('drawer')).toBeInTheDocument();
    });

    it('does not render drawer when pathname does not include the user id', () => {
      mockUseUser.mockReturnValue({ data: user, isLoading: false, error: null, isError: false });
      mockUsePathname.mockReturnValue('/users');
      render(<UserDrawer id={USER_ID} />);
      expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
    });
  });

  describe('open state via prop', () => {
    const user = createUserDetail({ id: undefined });

    beforeEach(() => {
      mockUseUser.mockReturnValue({ data: user, isLoading: false, error: null, isError: false });
      mockUsePathname.mockReturnValue('/some-other-path');
    });

    it('renders drawer when open prop is true', () => {
      render(<UserDrawer open={true} />);
      expect(screen.getByTestId('drawer')).toBeInTheDocument();
    });

    it('does not render drawer when open prop is false', () => {
      render(<UserDrawer open={false} />);
      expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
    });
  });

  // -- Avatar upload --------------------------------------------------------

  describe('avatar upload', () => {
    const user = createUserDetail({ id: USER_ID });

    beforeEach(() => {
      mockUseUser.mockReturnValue({ data: user, isLoading: false, error: null, isError: false });
    });

    it('shows avatar upload input for own profile', () => {
      mockUseSession.mockReturnValue({ data: { user: { id: USER_ID } } });
      const { container } = render(<UserDrawer id={USER_ID} />);
      expect(container.querySelector('#avatar-upload')).toBeInTheDocument();
    });

    it('does not show avatar upload input for another user profile', () => {
      mockUseSession.mockReturnValue({ data: { user: { id: 'different-user' } } });
      const { container } = render(<UserDrawer id={USER_ID} />);
      expect(container.querySelector('#avatar-upload')).not.toBeInTheDocument();
    });
  });

  // -- Close button ---------------------------------------------------------

  describe('close button', () => {
    const user = createUserDetail({ id: USER_ID });

    beforeEach(() => {
      mockUseUser.mockReturnValue({ data: user, isLoading: false, error: null, isError: false });
    });

    it('calls router.push to /users when close button is clicked', () => {
      render(<UserDrawer id={USER_ID} />);
      fireEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(mockRouterPush).toHaveBeenCalledWith('/users');
    });
  });

  // -- Default tab ----------------------------------------------------------

  describe('default tab', () => {
    const user = createUserDetail({ id: USER_ID });

    beforeEach(() => {
      mockUseUser.mockReturnValue({ data: user, isLoading: false, error: null, isError: false });
    });

    it('defaults to the details tab', () => {
      render(<UserDrawer id={USER_ID} tab='details' />);
      expect(screen.getByTestId('tabs')).toHaveAttribute('data-value', 'details');
    });

    it('starts on the permissions tab when tab prop is set', () => {
      render(<UserDrawer id={USER_ID} tab='permissions' />);
      expect(screen.getByTestId('tabs')).toHaveAttribute('data-value', 'permissions');
    });

    it('starts on the security tab when tab prop is set', () => {
      render(<UserDrawer id={USER_ID} tab='security' />);
      expect(screen.getByTestId('tabs')).toHaveAttribute('data-value', 'security');
    });
  });
});
