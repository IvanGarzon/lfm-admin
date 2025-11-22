import { Skeleton } from '@/components/ui/skeleton';
import { Box } from '@/components/ui/box';
import { DrawerBody, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

export function InvoiceDrawerSkeleton() {
  return (
    <>
      <DrawerHeader className="-px-6 w-full">
        <DrawerTitle className="flex w-full items-center justify-between px-6">
          <Skeleton className="h-8 w-1/3" />
        </DrawerTitle>
        <DrawerDescription />
      </DrawerHeader>

      <DrawerBody className="p-6 space-y-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Box key={index}>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <Box className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </Box>
          </Box>
        ))}
      </DrawerBody>
    </>
  );
}
