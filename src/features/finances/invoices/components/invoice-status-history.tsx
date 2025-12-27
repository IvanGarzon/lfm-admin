'use client';

import { StatusHistory } from '@/features/finances/shared';
import { InvoiceStatusBadge } from './invoice-status-badge';
import type { InvoiceStatusHistoryItem } from '../types';

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
      renderStatusBadge={(status) => <InvoiceStatusBadge status={status} />}
      title="Status History"
      emptyMessage="No status history available."
    />
  );
}
