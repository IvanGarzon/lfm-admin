import { CheckCircle2, XCircle, Loader2, Clock, AlertCircle } from 'lucide-react';
import type { ExecutionStatus } from '@/prisma/client';
import { StatusBadge, type StatusBadgeConfig } from '@/components/shared/status-badge';

interface TaskExecutionStatusBadgeProps {
  status: ExecutionStatus;
  className?: string;
}

/**
 * Configuration for task execution status badges
 * Maps each execution status to its visual representation
 */
const EXECUTION_STATUS_CONFIG: Record<ExecutionStatus, StatusBadgeConfig> = {
  COMPLETED: {
    label: 'Completed',
    variant: 'outline',
    className: 'bg-green-50 text-green-700 border-green-200',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  FAILED: {
    label: 'Failed',
    variant: 'outline',
    className: 'bg-red-50 text-red-700 border-red-200',
    icon: <XCircle className="h-4 w-4" />,
  },
  RUNNING: {
    label: 'Running',
    variant: 'outline',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
  },
  CANCELLED: {
    label: 'Cancelled',
    variant: 'outline',
    className: 'bg-gray-50 text-gray-700 border-gray-200',
    icon: <AlertCircle className="h-4 w-4" />,
  },
  TIMEOUT: {
    label: 'Timeout',
    variant: 'outline',
    className: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: <Clock className="h-4 w-4" />,
  },
};

/**
 * Task execution status badge component
 *
 * Displays a visual badge for task execution statuses with appropriate colours and icons.
 */
export function TaskExecutionStatusBadge({ status, className }: TaskExecutionStatusBadgeProps) {
  return <StatusBadge status={status} config={EXECUTION_STATUS_CONFIG} className={className} />;
}
