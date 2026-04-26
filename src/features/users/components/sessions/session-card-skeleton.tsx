import { Skeleton } from '@/components/ui/skeleton';
import { Box } from '@/components/ui/box';

export function SessionCardSkeleton() {
  return (
    <Box className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      {/* Icon */}
      <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />

      {/* Text lines */}
      <Box className="min-w-0 flex-1 space-y-1.5">
        <Box className="flex items-center gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </Box>
        <Box className="flex items-center gap-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-20" />
        </Box>
      </Box>

      {/* Actions */}
      <Box className="flex shrink-0 gap-1">
        <Skeleton className="h-7 w-14" />
        <Skeleton className="h-7 w-14" />
      </Box>
    </Box>
  );
}
