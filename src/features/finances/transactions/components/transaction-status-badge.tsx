import { Hourglass, CircleCheckBig, Ban } from 'lucide-react';
import type { TransactionStatus } from '@/zod/schemas/enums/TransactionStatus.schema';
import { StatusBadge, type StatusBadgeConfig } from '@/components/shared/status-badge';

interface TransactionStatusBadgeProps {
  status: TransactionStatus;
  className?: string;
}

/**
 * Configuration for transaction status badges
 * Maps each transaction status to its visual representation
 */
const TRANSACTION_STATUS_CONFIG: Record<TransactionStatus, StatusBadgeConfig> = {
  PENDING: {
    label: 'Pending',
    variant: 'outline',
    className:
      'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800',
    icon: <Hourglass className="h-4 w-4" aria-hidden="true" />,
  },
  COMPLETED: {
    label: 'Completed',
    variant: 'outline',
    className:
      'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
    icon: <CircleCheckBig className="h-4 w-4" aria-hidden="true" />,
  },
  CANCELLED: {
    label: 'Cancelled',
    variant: 'outline',
    className:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
    icon: <Ban className="h-4 w-4" aria-hidden="true" />,
  },
};

/**
 * Transaction status badge component
 *
 * Displays a visual badge for transaction statuses with appropriate colours and icons.
 */
export function TransactionStatusBadge({ status, className }: TransactionStatusBadgeProps) {
  return <StatusBadge status={status} config={TRANSACTION_STATUS_CONFIG} className={className} />;
}
