import { Box } from '@/components/ui/box';
import { Skeleton } from '@/components/ui/skeleton';
import { DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { VisuallyHidden } from '@/components/ui/visually-hidden';

export function ProductDrawerSkeleton() {
  return (
    <>
      <DrawerHeader>
        <DrawerTitle>Product Details</DrawerTitle>
        <VisuallyHidden>
          <DrawerDescription>Loading product details.</DrawerDescription>
        </VisuallyHidden>
      </DrawerHeader>
      <Box className="p-6 space-y-6">
        {/* Name field */}
        <Box className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </Box>

        {/* Description field */}
        <Box className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-20 w-full" />
        </Box>

        {/* Status field */}
        <Box className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </Box>

        {/* Price and Stock */}
        <Box className="grid grid-cols-2 gap-4">
          <Box className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
          </Box>
          <Box className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
          </Box>
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
