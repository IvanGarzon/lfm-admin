import { X, Check, CircleDashed, Send, Clock, FileCheck } from 'lucide-react';

import type { QuoteStatusType } from '@/zod/inputTypeSchemas/QuoteStatusSchema';
import { Badge } from '@/components/ui/badge';

type StatusBadgeProps = {
  status: QuoteStatusType;
};

const statusConfig: Record<
  QuoteStatusType,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
    icon?: React.ReactNode;
  }
> = {
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
  ACCEPTED: {
    label: 'Accepted',
    variant: 'outline',
    className: 'bg-green-50 text-green-700 border-green-200',
    icon: <Check className="h-4 w-4" />,
  },
  REJECTED: {
    label: 'Rejected',
    variant: 'outline',
    className: 'bg-red-50 text-red-700 border-red-200',
    icon: <X className="h-4 w-4" />,
  },
  EXPIRED: {
    label: 'Expired',
    variant: 'outline',
    className: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: <Clock className="h-4 w-4" />,
  },
  CONVERTED: {
    label: 'Converted',
    variant: 'outline',
    className: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: <FileCheck className="h-4 w-4" />,
  },
};

export function QuoteStatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.icon}
      {config.label}
    </Badge>
  );
}
