import { Skeleton } from '@/components/ui/skeleton';
import { Box } from '@/components/ui/box';

export function SessionCardSkeleton() {
  return (
    <Box className="flex flex-col border rounded p-4 bg-white border-gray-200">
      {/* Header */}
      <Box className="flex items-center justify-between gap-2 mb-4 pb-3 border-b">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-7 w-20" />
      </Box>

      {/* Body */}
      <Box className="flex items-start gap-4">
        {/* Icon */}
        <Skeleton className="w-10 h-10 rounded-lg shrink-0" />

        <Box className="flex-1 min-w-0 space-y-3">
          {/* Badges */}
          <Box className="flex items-center gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
          </Box>

          {/* Details Grid */}
          <Box className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-36" />
          </Box>

          {/* Expiration */}
          <Box className="flex items-center justify-between pt-2 border-t border-dashed">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-6 w-28" />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
