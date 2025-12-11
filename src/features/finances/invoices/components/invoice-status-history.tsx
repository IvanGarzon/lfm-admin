'use client';

import { format } from 'date-fns';
import { Clock, ArrowRight } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InvoiceStatusBadge } from './invoice-status-badge';
import type { InvoiceStatusHistoryItem } from '../types';

interface InvoiceStatusHistoryProps {
  history: InvoiceStatusHistoryItem[];
}

export function InvoiceStatusHistory({ history }: InvoiceStatusHistoryProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No status history available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Status History</CardTitle>
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
                          <InvoiceStatusBadge status={item.previousStatus} />
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        </>
                      ): null}
                      <InvoiceStatusBadge status={item.status} />
                    </Box>

                    <Box className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Clock className="h-3 w-3" />
                      <time dateTime={item.changedAt.toISOString()}>
                        {format(new Date(item.changedAt), 'PPp')}
                      </time>
                    </Box>

                    {item.notes ? (
                      <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                    ): null}
                  </Box>
                </Box>

                {/* Vertical line - only show if not the last item */}
                {!isLast ? (
                  <Box className="absolute left-[11px] top-6 -bottom-4 w-px bg-border" />
                ): null}
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}
