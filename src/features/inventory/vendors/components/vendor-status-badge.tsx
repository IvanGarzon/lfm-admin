import { Badge } from '@/components/ui/badge';
import { VendorStatus } from '@/prisma/client';

interface VendorStatusBadgeProps {
  status: VendorStatus;
}

const statusConfig: Record<
  VendorStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  [VendorStatus.ACTIVE]: { label: 'Active', variant: 'default' },
  [VendorStatus.INACTIVE]: { label: 'Inactive', variant: 'secondary' },
  [VendorStatus.SUSPENDED]: { label: 'Suspended', variant: 'destructive' },
};

export function VendorStatusBadge({ status }: VendorStatusBadgeProps) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
