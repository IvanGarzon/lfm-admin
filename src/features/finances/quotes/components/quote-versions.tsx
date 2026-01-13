'use client';

import { format } from 'date-fns';
import { Check } from 'lucide-react';
import { QuoteStatusBadge } from './quote-status-badge';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Box } from '@/components/ui/box';
import { cn } from '@/lib/utils';

interface QuoteVersionsProps {
  currentVersionId: string;
  versions?: any[];
  isLoading?: boolean;
}

export function QuoteVersions({
  currentVersionId,
  versions,
  isLoading = false,
}: QuoteVersionsProps) {
  if (isLoading) {
    return (
      <Box className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </Box>
    );
  }

  if (!versions || versions.length <= 1) {
    return null;
  }

  return (
    <Box className="space-y-4">
      {versions.map((version) => {
        const isCurrent = version.id === currentVersionId;
        return (
          <Box
            key={version.id}
            className={cn(
              'w-full p-4 border rounded-lg dark:bg-gray-900',
              isCurrent ? 'bg-primary/5 border-primary' : 'border-border',
            )}
          >
            <Box className="flex items-start justify-between gap-2">
              <Box className="flex-1 min-w-0">
                <Box className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">v{version.versionNumber}</span>
                  {isCurrent ? (
                    <span className="flex items-center gap-1 text-xs text-primary font-medium">
                      <Check className="h-3 w-3" />
                      Current
                    </span>
                  ) : null}
                </Box>
                <Box className="text-xs text-muted-foreground mb-2">{version.quoteNumber}</Box>
                <Box className="flex flex-wrap items-center gap-2">
                  <QuoteStatusBadge status={version.status} />
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency({ number: version.amount })}
                  </span>
                </Box>
              </Box>
              <Box className="text-right shrink-0">
                <Box className="text-xs text-muted-foreground">
                  {format(new Date(version.createdAt), 'MMM d, yyyy')}
                </Box>
                <Box className="text-xs text-muted-foreground">
                  {format(new Date(version.createdAt), 'h:mm a')}
                </Box>
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
