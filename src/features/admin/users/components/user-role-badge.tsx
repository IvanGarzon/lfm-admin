import { ShieldCheck, Shield, UserCog, User } from 'lucide-react';
import type { UserRole } from '@/prisma/client';
import { StatusBadge, type StatusBadgeConfig } from '@/components/shared/status-badge';

interface UserRoleBadgeProps {
  role: UserRole;
  className?: string;
}

/**
 * Configuration for user role badges
 * Maps each user role to its visual representation
 */
const USER_ROLE_CONFIG: Record<UserRole, StatusBadgeConfig> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    variant: 'outline',
    className:
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800',
    icon: <ShieldCheck className="h-4 w-4" />,
  },
  ADMIN: {
    label: 'Admin',
    variant: 'outline',
    className:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
    icon: <Shield className="h-4 w-4" />,
  },
  MANAGER: {
    label: 'Manager',
    variant: 'outline',
    className:
      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-800',
    icon: <UserCog className="h-4 w-4" />,
  },
  USER: {
    label: 'User',
    variant: 'outline',
    className:
      'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700',
    icon: <User className="h-4 w-4" />,
  },
};

/**
 * User role badge component
 *
 * Displays a visual badge for user roles with appropriate colours and icons.
 */
export function UserRoleBadge({ role, className }: UserRoleBadgeProps) {
  return <StatusBadge status={role} config={USER_ROLE_CONFIG} className={className} />;
}
