import { Shell } from '@/components/shared/shell';
import { Skeleton } from '@/components/ui/skeleton';
import { Box } from '@/components/ui/box';

export default function QuotesLoading() {
  return (
    <Shell scrollable>
      <Box className="space-y-4 w-full">
        <Box className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <Box className="min-w-0 space-y-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-4 w-48" />
          </Box>
          <Box className="flex gap-3">
            <Skeleton className="h-10 w-[200px]" />
            <Skeleton className="h-10 w-32" />
          </Box>
        </Box>

        <Skeleton className="h-[500px] w-full rounded-xl border" />
      </Box>
    </Shell>
  );
}
