import {
  Ban,
  CircleCheckBig,
  Hourglass,
  CircleDashed,
  Timer,
  SquareDashedTopSolid,
} from 'lucide-react';
import { InvoiceStatus } from '@/prisma/client';
import { StatusBadge, type StatusBadgeConfig } from '@/features/finances/shared';

type InvoiceStatusBadgeProps = {
  status: InvoiceStatus;
  className?: string;
};

/**
 * Configuration for invoice status badges
 * Maps each invoice status to its visual representation
 */
const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, StatusBadgeConfig> = {
  DRAFT: {
    label: 'Draft',
    variant: 'outline',
    className: 'bg-gray-50 text-gray-700 border-gray-200',
    icon: <CircleDashed className="h-4 w-4" />,
  },
  PENDING: {
    label: 'Pending',
    variant: 'outline',
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    icon: <Hourglass className="h-4 w-4" />,
  },
  PAID: {
    label: 'Paid',
    variant: 'outline',
    className: 'bg-green-50 text-green-700 border-green-200',
    icon: <CircleCheckBig className="h-4 w-4" />,
  },
  PARTIALLY_PAID: {
    label: 'Partially Paid',
    variant: 'outline',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <SquareDashedTopSolid className="h-4 w-4" />,
  },
  OVERDUE: {
    label: 'Overdue',
    variant: 'outline',
    className: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: <Timer className="h-4 w-4" />,
  },
  CANCELLED: {
    label: 'Cancelled',
    variant: 'outline',
    className: 'bg-red-50 text-red-700 border-red-200',
    icon: <Ban className="h-4 w-4" />,
  },
};

/**
 * Invoice status badge component
 *
 * Displays a visual badge for invoice statuses with appropriate colors and icons.
 * Now uses the shared StatusBadge component for consistency across finance modules.
 */
export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  return <StatusBadge status={status} config={INVOICE_STATUS_CONFIG} className={className} />;
}
