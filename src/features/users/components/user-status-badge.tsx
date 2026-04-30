import { CheckCircle2, CircleDashed, Ban } from 'lucide-react';
import type { UserStatus } from '@/zod/schemas/enums/UserStatus.schema';
import { StatusBadge, type StatusBadgeConfig } from '@/components/shared/status-badge';

type UserStatusBadgeProps = {
  status: UserStatus;
  className?: string;
};

const USER_STATUS_CONFIG: Record<UserStatus, StatusBadgeConfig> = {
  ACTIVE: {
    label: 'Active',
    variant: 'outline',
    className:
      'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
    icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
  },
  INVITED: {
    label: 'Invited',
    variant: 'outline',
    className:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
    icon: <CircleDashed className="h-4 w-4" aria-hidden="true" />,
  },
  SUSPENDED: {
    label: 'Suspended',
    variant: 'outline',
    className:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
    icon: <Ban className="h-4 w-4" aria-hidden="true" />,
  },
};

export function UserStatusBadge({ status, className }: UserStatusBadgeProps) {
  return <StatusBadge status={status} config={USER_STATUS_CONFIG} className={className} />;
}
