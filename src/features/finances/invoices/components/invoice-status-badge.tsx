import { X, Check, AlertCircle, CircleDashed, Timer } from 'lucide-react';

import type { InvoiceStatusType } from '@/zod/inputTypeSchemas/InvoiceStatusSchema';
import { Badge } from '@/components/ui/badge';

type StatusBadgeProps = {
  status: InvoiceStatusType;
};

const statusConfig: Record<
  InvoiceStatusType,
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
  PENDING: {
    label: 'Pending',
    variant: 'outline',
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    icon: <AlertCircle className="h-4 w-4" />,
  },
  PAID: {
    label: 'Paid',
    variant: 'outline',
    className: 'bg-green-50 text-green-700 border-green-200',
    icon: <Check className="h-4 w-4" />,
  },
  CANCELLED: {
    label: 'Cancelled',
    variant: 'outline',
    className: 'bg-red-50 text-red-700 border-red-200',
    icon: <X className="h-4 w-4" />,
  },
  OVERDUE: {
    label: 'Overdue',
    variant: 'outline',
    className: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: <Timer className="h-4 w-4" />,
  },
};

export function InvoiceStatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.icon}
      {config.label}
    </Badge>
  );
}
