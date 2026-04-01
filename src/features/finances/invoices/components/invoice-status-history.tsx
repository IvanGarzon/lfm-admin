'use client';

import { StatusHistory } from '@/features/finances/shared/components/status-history';
import { InvoiceStatusBadge } from './invoice-status-badge';
import type { InvoiceStatusHistoryItem } from '../types';
import type { InvoiceStatus } from '@/zod/schemas/enums/InvoiceStatus.schema';

interface InvoiceStatusHistoryProps {
  history: InvoiceStatusHistoryItem[];
}

/**
 * Invoice status history component
 *
 * Displays a timeline of invoice status changes with timestamps and notes.
 * Now uses the shared StatusHistory component for consistency across finance modules.
 */
export function InvoiceStatusHistory({ history }: InvoiceStatusHistoryProps) {
  return (
    <StatusHistory
      history={history}
      renderStatusBadge={(status: InvoiceStatus) => <InvoiceStatusBadge status={status} />}
      title="Status History"
      emptyMessage="No status history available."
    />
  );
}
