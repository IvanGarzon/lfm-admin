import { TrendingUp, TrendingDown } from 'lucide-react';
import type { TransactionType } from '@/zod/schemas/enums/TransactionType.schema';
import { StatusBadge, type StatusBadgeConfig } from '@/components/shared/status-badge';

interface TransactionTypeBadgeProps {
  type: TransactionType;
  className?: string;
}

/**
 * Configuration for transaction type badges
 * Maps each transaction type to its visual representation
 */
const TRANSACTION_TYPE_CONFIG: Record<TransactionType, StatusBadgeConfig> = {
  INCOME: {
    label: 'Income',
    variant: 'outline',
    className: 'bg-green-50 text-green-700 border-green-200',
    icon: <TrendingUp className="h-4 w-4" />,
  },
  EXPENSE: {
    label: 'Expense',
    variant: 'outline',
    className: 'bg-red-50 text-red-700 border-red-200',
    icon: <TrendingDown className="h-4 w-4" />,
  },
};

/**
 * Transaction type badge component
 *
 * Displays a visual badge for transaction types with appropriate colours and icons.
 */
export function TransactionTypeBadge({ type, className }: TransactionTypeBadgeProps) {
  return <StatusBadge status={type} config={TRANSACTION_TYPE_CONFIG} className={className} />;
}
