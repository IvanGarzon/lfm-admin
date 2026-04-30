import { CheckCircle2, CircleDashed } from 'lucide-react';
import type { OrganizationStatus } from '@/prisma/client';
import { StatusBadge, type StatusBadgeConfig } from '@/components/shared/status-badge';

type OrganizationStatusBadgeProps = {
  status: OrganizationStatus;
  className?: string;
};

/**
 * Configuration for organisation status badges
 * Maps each organisation status to its visual representation
 */
const ORGANIZATION_STATUS_CONFIG: Record<OrganizationStatus, StatusBadgeConfig> = {
  ACTIVE: {
    label: 'Active',
    variant: 'outline',
    className:
      'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
    icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
  },
  INACTIVE: {
    label: 'Inactive',
    variant: 'outline',
    className:
      'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700',
    icon: <CircleDashed className="h-4 w-4" aria-hidden="true" />,
  },
};

/**
 * Organisation status badge component
 *
 * Displays a visual badge for organisation statuses with appropriate colours and icons.
 */
export function OrganizationStatusBadge({ status, className }: OrganizationStatusBadgeProps) {
  return <StatusBadge status={status} config={ORGANIZATION_STATUS_CONFIG} className={className} />;
}
