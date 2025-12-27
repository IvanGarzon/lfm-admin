import { X, Ban, Check, CircleDashed, Send, Clock, FileCheck, Pause } from 'lucide-react';
import type { QuoteStatusType } from '@/zod/inputTypeSchemas/QuoteStatusSchema';
import { StatusBadge, type StatusBadgeConfig } from '@/features/finances/shared';

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
    className: 'bg-gray-50 text-gray-700 border-gray-200',
    icon: <CircleDashed className="h-4 w-4" />,
  },
  SENT: {
    label: 'Sent',
    variant: 'outline',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <Send className="h-4 w-4" />,
  },
  ON_HOLD: {
    label: 'On Hold',
    variant: 'outline',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <Pause className="h-4 w-4" />,
  },
  ACCEPTED: {
    label: 'Accepted',
    variant: 'outline',
    className: 'bg-green-50 text-green-700 border-green-200',
    icon: <Check className="h-4 w-4" />,
  },
  REJECTED: {
    label: 'Rejected',
    variant: 'outline',
    className: 'bg-pink-50 text-pink-700 border-pink-200',
    icon: <X className="h-4 w-4" />,
  },
  EXPIRED: {
    label: 'Expired',
    variant: 'outline',
    className: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: <Clock className="h-4 w-4" />,
  },
  CANCELLED: {
    label: 'Cancelled',
    variant: 'outline',
    className: 'bg-red-50 text-red-700 border-red-200',
    icon: <Ban className="h-4 w-4" />,
  },
  CONVERTED: {
    label: 'Converted',
    variant: 'outline',
    className: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: <FileCheck className="h-4 w-4" />,
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
