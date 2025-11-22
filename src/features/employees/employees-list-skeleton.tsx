import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Box } from '@/components/ui/box';
import { DataTableSkeleton } from '@/components/shared/tableV1/DataTableSkeleton';

export function EmployeesListSkeleton() {
  return (
    <AnimatePresence>
      <motion.div
        key="loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Box className="space-y-4">
          <Box className="flex items-center justify-between">
            <Box>
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-60 mt-2" />
            </Box>
            <Skeleton className="h-9 w-32" />
          </Box>
          <Skeleton className="h-0.5 w-full mb-4" />
        </Box>

        <DataTableSkeleton columnCount={5} rowCount={8} filterCount={2} />
      </motion.div>
    </AnimatePresence>
  );
}
