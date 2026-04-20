import { CheckCircle2, Ban } from 'lucide-react';
import type { TenantStatus } from '@/prisma/client';
import { StatusBadge, type StatusBadgeConfig } from '@/components/shared/status-badge';

interface TenantStatusBadgeProps {
  status: TenantStatus;
  className?: string;
}

/**
 * Configuration for tenant status badges
 * Maps each tenant status to its visual representation
 */
const TENANT_STATUS_CONFIG: Record<TenantStatus, StatusBadgeConfig> = {
  ACTIVE: {
    label: 'Active',
    variant: 'outline',
    className: 'bg-green-50 text-green-700 border-green-200',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  SUSPENDED: {
    label: 'Suspended',
    variant: 'outline',
    className: 'bg-red-50 text-red-700 border-red-200',
    icon: <Ban className="h-4 w-4" />,
  },
};

/**
 * Tenant status badge component
 *
 * Displays a visual badge for tenant statuses with appropriate colours and icons.
 */
export function TenantStatusBadge({ status, className }: TenantStatusBadgeProps) {
  return <StatusBadge status={status} config={TENANT_STATUS_CONFIG} className={className} />;
}
