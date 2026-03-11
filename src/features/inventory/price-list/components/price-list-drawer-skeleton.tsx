import { Box } from '@/components/ui/box';
import { Skeleton } from '@/components/ui/skeleton';
import { DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

export function PriceListDrawerSkeleton() {
  return (
    <>
      <DrawerHeader>
        <DrawerTitle>Price List Details</DrawerTitle>
      </DrawerHeader>
      <Box className="p-6 space-y-6">
        {/* Name field */}
        <Box className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </Box>

        {/* Category field */}
        <Box className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </Box>

        {/* Price and Multiplier */}
        <Box className="grid grid-cols-2 gap-4">
          <Box className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </Box>
          <Box className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </Box>
        </Box>

        {/* Advanced settings */}
        <Box className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </Box>

        {/* Image URL field */}
        <Box className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </Box>
      </Box>
    </>
  );
}
