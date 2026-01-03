import { Badge } from '@/components/ui/badge';
import { TransactionStatus } from '../types';

interface TransactionStatusBadgeProps {
  status: TransactionStatus;
}

export function TransactionStatusBadge({ status }: TransactionStatusBadgeProps) {
  switch (status) {
    case 'COMPLETED':
      return (
        <Badge variant="success" className="capitalize">
          Completed
        </Badge>
      );
    case 'PENDING':
      return (
        <Badge variant="warning" className="capitalize">
          Pending
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge variant="destructive" className="capitalize">
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
