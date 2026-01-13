'use client';

import { format } from 'date-fns';
import { Clock, ArrowRight } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { UserAvatar } from '@/components/shared/user-avatar';
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
}: StatusHistoryProps<TStatus>) {
  return (
    <Box className="space-y-0">
      {history.map((item, index) => {
        const isLast = index === history.length - 1;

        return (
          <Box key={item.id} className="relative">
            <Box className="flex gap-3">
              {/* Timeline dot */}
              <Box className="relative flex h-6 w-6 shrink-0 items-center justify-center mt-1">
                <Box className="h-2.5 w-2.5 rounded-full border-2 border-primary bg-primary z-10" />
              </Box>

              {/* Content */}
              <Box className="flex-1 pb-4">
                <Box className="rounded-lg border p-4">
                  {/* Status and Date Row */}
                  <Box className="flex items-start justify-between gap-4 mb-3">
                    {/* Status Row */}
                    <Box className="flex flex-wrap items-center gap-2">
                      {item.previousStatus ? (
                        <>
                          {renderStatusBadge(item.previousStatus)}
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </>
                      ) : null}
                      {renderStatusBadge(item.status)}
                    </Box>

                    {/* Date and Time */}
                    <Box className="text-right shrink-0">
                      <Box className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Clock className="h-3.5 w-3.5" />
                        <time dateTime={item.updatedAt.toISOString()}>
                          {format(new Date(item.updatedAt), 'MMM d, yyyy')}
                        </time>
                      </Box>
                      <Box className="text-xs text-muted-foreground">
                        {format(new Date(item.updatedAt), 'h:mm a')}
                      </Box>
                    </Box>
                  </Box>

                  {/* Updated By Section */}
                  {item.user ? (
                    <Box className="flex items-center gap-3 p-3 rounded-md bg-muted/30 mb-3">
                      <UserAvatar
                        user={{
                          name: `${item.user.firstName} ${item.user.lastName}`,
                          image: item.user.avatarUrl ?? undefined,
                        }}
                        className="h-8 w-8"
                        fontSize="0.75rem"
                      />
                      <Box className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">Updated by</p>
                        <p className="text-sm font-medium truncate">
                          {`${item.user.firstName} ${item.user.lastName}`}
                        </p>
                      </Box>
                    </Box>
                  ) : null}

                  {/* Notes */}
                  {item.notes ? (
                    <Box className="rounded-md bg-muted/30 p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm text-foreground">{item.notes}</p>
                    </Box>
                  ) : null}
                </Box>
              </Box>
            </Box>

            {/* Vertical line - only show if not the last item */}
            {!isLast ? (
              <Box className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-border" />
            ) : null}
          </Box>
        );
      })}
    </Box>
  );
}
