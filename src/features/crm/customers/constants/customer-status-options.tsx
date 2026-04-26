import { CheckCircle2, CircleDashed, Trash2 } from 'lucide-react';
import {
  CustomerStatusSchema,
  type CustomerStatus,
} from '@/zod/schemas/enums/CustomerStatus.schema';

const CUSTOMER_STATUS_ICONS: Record<CustomerStatus, React.FC<React.SVGProps<SVGSVGElement>>> = {
  ACTIVE: CheckCircle2,
  INACTIVE: CircleDashed,
  DELETED: Trash2,
};

export const CUSTOMER_STATUS_OPTIONS = CustomerStatusSchema.options.map((status) => ({
  value: status,
  label: status.charAt(0) + status.slice(1).toLowerCase(),
  icon: CUSTOMER_STATUS_ICONS[status],
}));
