import { Package, PackageMinus, PackageX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ProductStatus } from '@/prisma/client';
import { cn } from '@/lib/utils';

interface ProductStatusBadgeProps {
  status: ProductStatus;
  className?: string;
}

const statusConfig: Record<
  ProductStatus,
  {
    label: string;
    className: string;
    icon: React.ReactNode;
  }
> = {
  ACTIVE: {
    label: 'Active',
    className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
    icon: <Package className="h-3 w-3" />,
  },
  INACTIVE: {
    label: 'Inactive',
    className: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100',
    icon: <PackageMinus className="h-3 w-3" />,
  },
  OUT_OF_STOCK: {
    label: 'Out of Stock',
    className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
    icon: <PackageX className="h-3 w-3" />,
  },
};

export function ProductStatusBadge({ status, className }: ProductStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 px-2.5 py-0.5 font-medium transition-colors',
        config.className,
        className,
      )}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
}
