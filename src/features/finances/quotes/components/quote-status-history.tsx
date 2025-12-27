'use client';

import { StatusHistory } from '@/features/finances/shared';
import { QuoteStatusBadge } from './quote-status-badge';
import type { QuoteStatusHistoryItem } from '../types';

interface QuoteStatusHistoryProps {
  history: QuoteStatusHistoryItem[];
}

/**
 * Quote status history component
 *
 * Displays a timeline of quote status changes with timestamps and notes.
 * Now uses the shared StatusHistory component for consistency across finance modules.
 */
export function QuoteStatusHistory({ history }: QuoteStatusHistoryProps) {
  return (
    <StatusHistory
      history={history}
      renderStatusBadge={(status) => <QuoteStatusBadge status={status} />}
      title="Status History"
      emptyMessage="No status history available."
    />
  );
}
