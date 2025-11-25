'use client';

import { format } from 'date-fns';
import { Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuoteStatusBadge } from './quote-status-badge';
import type { QuoteStatusHistoryItem } from '../types';

interface QuoteStatusHistoryProps {
  history: QuoteStatusHistoryItem[];
}

export function QuoteStatusHistory({ history }: QuoteStatusHistoryProps) {
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
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

          {history.map((item, index) => (
            <div key={item.id} className="relative flex gap-4">
              {/* Timeline dot */}
              <div className="relative flex h-6 w-6 shrink-0 items-center justify-center">
                <div className="h-3 w-3 rounded-full border-2 border-primary bg-background" />
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {item.previousStatus && (
                    <>
                      <QuoteStatusBadge status={item.previousStatus} />
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </>
                  )}
                  <QuoteStatusBadge status={item.status} />
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Clock className="h-3 w-3" />
                  <time dateTime={item.changedAt.toISOString()}>
                    {format(new Date(item.changedAt), 'PPp')}
                  </time>
                </div>

                {item.notes && (
                  <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
