import { Package, PackageMinus, PackageX } from 'lucide-react';
import type { ProductStatus } from '@/prisma/client';
import { StatusBadge, type StatusBadgeConfig } from '@/components/shared/status-badge';

interface ProductStatusBadgeProps {
  status: ProductStatus;
  className?: string;
}

/**
 * Configuration for product status badges
 * Maps each product status to its visual representation
 */
const PRODUCT_STATUS_CONFIG: Record<ProductStatus, StatusBadgeConfig> = {
  ACTIVE: {
    label: 'Active',
    variant: 'outline',
    className: 'bg-green-50 text-green-700 border-green-200',
    icon: <Package className="h-4 w-4" />,
  },
  INACTIVE: {
    label: 'Inactive',
    variant: 'outline',
    className: 'bg-gray-50 text-gray-700 border-gray-200',
    icon: <PackageMinus className="h-4 w-4" />,
  },
  OUT_OF_STOCK: {
    label: 'Out of Stock',
    variant: 'outline',
    className: 'bg-red-50 text-red-700 border-red-200',
    icon: <PackageX className="h-4 w-4" />,
  },
};

/**
 * Product status badge component
 *
 * Displays a visual badge for product statuses with appropriate colours and icons.
 */
export function ProductStatusBadge({ status, className }: ProductStatusBadgeProps) {
  return <StatusBadge status={status} config={PRODUCT_STATUS_CONFIG} className={className} />;
}
