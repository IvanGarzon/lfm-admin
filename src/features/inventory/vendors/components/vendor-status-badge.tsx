import { CheckCircle2, CircleDashed, Ban } from 'lucide-react';
import { VendorStatus } from '@/prisma/client';
import { StatusBadge, type StatusBadgeConfig } from '@/components/shared/status-badge';

interface VendorStatusBadgeProps {
  status: VendorStatus;
  className?: string;
}

/**
 * Configuration for vendor status badges
 * Maps each vendor status to its visual representation
 */
const VENDOR_STATUS_CONFIG: Record<VendorStatus, StatusBadgeConfig> = {
  [VendorStatus.ACTIVE]: {
    label: 'Active',
    variant: 'outline',
    className: 'bg-green-50 text-green-700 border-green-200',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  [VendorStatus.INACTIVE]: {
    label: 'Inactive',
    variant: 'outline',
    className: 'bg-gray-50 text-gray-700 border-gray-200',
    icon: <CircleDashed className="h-4 w-4" />,
  },
  [VendorStatus.SUSPENDED]: {
    label: 'Suspended',
    variant: 'outline',
    className: 'bg-red-50 text-red-700 border-red-200',
    icon: <Ban className="h-4 w-4" />,
  },
};

/**
 * Vendor status badge component
 *
 * Displays a visual badge for vendor statuses with appropriate colours and icons.
 */
export function VendorStatusBadge({ status, className }: VendorStatusBadgeProps) {
  return <StatusBadge status={status} config={VENDOR_STATUS_CONFIG} className={className} />;
}
