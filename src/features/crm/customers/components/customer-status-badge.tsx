import { CheckCircle2, CircleDashed, Trash2 } from 'lucide-react';
import type { CustomerStatus } from '@/prisma/client';
import { StatusBadge, type StatusBadgeConfig } from '@/components/shared/status-badge';

type CustomerStatusBadgeProps = {
  status: CustomerStatus;
  className?: string;
};

/**
 * Configuration for customer status badges
 * Maps each customer status to its visual representation
 */
const CUSTOMER_STATUS_CONFIG: Record<CustomerStatus, StatusBadgeConfig> = {
  ACTIVE: {
    label: 'Active',
    variant: 'outline',
    className:
      'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  INACTIVE: {
    label: 'Inactive',
    variant: 'outline',
    className:
      'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700',
    icon: <CircleDashed className="h-4 w-4" />,
  },
  DELETED: {
    label: 'Deleted',
    variant: 'outline',
    className:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
    icon: <Trash2 className="h-4 w-4" />,
  },
};

/**
 * Customer status badge component
 *
 * Displays a visual badge for customer statuses with appropriate colours and icons.
 */
export function CustomerStatusBadge({ status, className }: CustomerStatusBadgeProps) {
  return <StatusBadge status={status} config={CUSTOMER_STATUS_CONFIG} className={className} />;
}
