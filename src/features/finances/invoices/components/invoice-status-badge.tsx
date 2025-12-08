import { Ban, CircleCheckBig, Hourglass, CircleDashed, Timer, SquareDashedTopSolid } from 'lucide-react';
import { InvoiceStatus } from '@/prisma/client';
import { Badge } from '@/components/ui/badge';

type StatusBadgeProps = {
  status: InvoiceStatus;
};

const statusConfig: Record<
  InvoiceStatus,
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

export function InvoiceStatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.icon}
      {config.label}
    </Badge>
  );
}
