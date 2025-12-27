'use client';

import { format } from 'date-fns';
import { Clock, ArrowRight } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FinanceStatusHistory, FinanceStatus } from '../types';

/**
 * Props for the generic StatusHistory component
 */
interface StatusHistoryProps<TStatus extends FinanceStatus> {
  /**
   * Array of status history items to display
   */
  history: FinanceStatusHistory<TStatus>[];

  /**
   * Render prop function to render a status badge
   * Receives the status value and should return a React element
   */
  renderStatusBadge: (status: TStatus) => React.ReactNode;

  /**
   * Optional title for the card header
   * @default "Status History"
   */
  title?: string;

  /**
   * Optional message to display when history is empty
   * @default "No status history available."
   */
  emptyMessage?: string;
}

/**
 * Generic status history component for finance entities
 *
 * Displays a timeline of status changes with timestamps, notes, and status badges.
 * Uses render props pattern to allow custom status badge rendering.
 * Used by both quotes and invoices with their specific status badge components.
 *
 * @example
 * ```tsx
 * <StatusHistory
 *   history={quoteHistory}
 *   renderStatusBadge={(status) => <QuoteStatusBadge status={status} />}
 *   title="Quote Status History"
 *   emptyMessage="No quote status changes yet"
 * />
 * ```
 */
export function StatusHistory<TStatus extends FinanceStatus>({
  history,
  renderStatusBadge,
  title = 'Status History',
  emptyMessage = 'No status history available.',
}: StatusHistoryProps<TStatus>) {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Box className="space-y-4">
          {history.map((item, index) => {
            const isLast = index === history.length - 1;

            return (
              <Box key={item.id} className="relative">
                <Box className="flex gap-4">
                  {/* Timeline dot */}
                  <Box className="relative flex h-6 w-6 shrink-0 items-center justify-center">
                    <Box className="h-3 w-3 rounded-full border-2 border-primary bg-background z-10" />
                  </Box>

                  {/* Content */}
                  <Box className="flex-1 pb-4">
                    <Box className="flex flex-wrap items-center gap-2 mb-1">
                      {item.previousStatus ? (
                        <>
                          {renderStatusBadge(item.previousStatus)}
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        </>
                      ) : null}
                      {renderStatusBadge(item.status)}
                    </Box>

                    <Box className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Clock className="h-3 w-3" />
                      <time dateTime={item.changedAt.toISOString()}>
                        {format(new Date(item.changedAt), 'PPp')}
                      </time>
                    </Box>

                    {item.notes ? (
                      <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                    ) : null}
                  </Box>
                </Box>

                {/* Vertical line - only show if not the last item */}
                {!isLast ? (
                  <Box className="absolute left-[11px] top-6 -bottom-4 w-px bg-border" />
                ) : null}
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}
