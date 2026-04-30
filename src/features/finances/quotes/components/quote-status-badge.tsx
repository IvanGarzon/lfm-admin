import { X, Ban, Check, CircleDashed, Send, Clock, FileCheck, Pause } from 'lucide-react';
import type { QuoteStatus as QuoteStatusType } from '@/zod/schemas/enums/QuoteStatus.schema';
import {
  StatusBadge,
  type StatusBadgeConfig,
} from '@/features/finances/shared/components/status-badge';

type QuoteStatusBadgeProps = {
  status: QuoteStatusType;
  className?: string;
};

/**
 * Configuration for quote status badges
 * Maps each quote status to its visual representation
 */
const QUOTE_STATUS_CONFIG: Record<QuoteStatusType, StatusBadgeConfig> = {
  DRAFT: {
    label: 'Draft',
    variant: 'outline',
    className:
      'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700',
    icon: <CircleDashed className="h-4 w-4" aria-hidden="true" />,
  },
  SENT: {
    label: 'Sent',
    variant: 'outline',
    className:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
    icon: <Send className="h-4 w-4" aria-hidden="true" />,
  },
  ON_HOLD: {
    label: 'On Hold',
    variant: 'outline',
    className:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
    icon: <Pause className="h-4 w-4" aria-hidden="true" />,
  },
  ACCEPTED: {
    label: 'Accepted',
    variant: 'outline',
    className:
      'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
    icon: <Check className="h-4 w-4" aria-hidden="true" />,
  },
  REJECTED: {
    label: 'Rejected',
    variant: 'outline',
    className:
      'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-400 dark:border-pink-800',
    icon: <X className="h-4 w-4" aria-hidden="true" />,
  },
  EXPIRED: {
    label: 'Expired',
    variant: 'outline',
    className:
      'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800',
    icon: <Clock className="h-4 w-4" aria-hidden="true" />,
  },
  CANCELLED: {
    label: 'Cancelled',
    variant: 'outline',
    className:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
    icon: <Ban className="h-4 w-4" aria-hidden="true" />,
  },
  CONVERTED: {
    label: 'Converted',
    variant: 'outline',
    className:
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800',
    icon: <FileCheck className="h-4 w-4" aria-hidden="true" />,
  },
};

/**
 * Quote status badge component
 *
 * Displays a visual badge for quote statuses with appropriate colors and icons.
 * Now uses the shared StatusBadge component for consistency across finance modules.
 */
export function QuoteStatusBadge({ status, className }: QuoteStatusBadgeProps) {
  return <StatusBadge status={status} config={QUOTE_STATUS_CONFIG} className={className} />;
}
