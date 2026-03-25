'use client';

import { useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Box } from '@/components/ui/box';
import { useTaskExecutions } from '../hooks/use-tasks';
import { TaskDrawerSkeleton } from './task-drawer-skeleton';
import { TaskStatsSummary } from './task-stats-summary';
import { TaskExecutionList } from './task-execution-list';

export function TaskExecutionDrawer({
  id,
  taskName,
  open,
  onClose,
}: {
  id?: string;
  taskName?: string;
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const { data: task, isLoading, error, isError } = useTaskExecutions(id || '', { limit: 20 });

  // Support both URL-based and controlled opening
  const isPathnameBased = id && pathname?.includes(`/tools/tasks/${id}/executions`);
  const isOpen = isPathnameBased || (open ?? false);

  const handleOpenChange = useCallback(
    (openState: boolean) => {
      if (!openState) {
        if (isPathnameBased) {
          router.push('/tools/tasks');
        } else {
          onClose?.();
        }
      }
    },
    [isPathnameBased, router, onClose],
  );

  return (
    <Drawer open={isOpen} modal={true} onOpenChange={handleOpenChange}>
      <DrawerContent className="overflow-x-hidden dark:bg-gray-925 pb-0!">
        {isLoading ? <TaskDrawerSkeleton /> : null}

        {isError ? (
          <Box className="p-6 text-destructive">
            <DrawerHeader>
              <DrawerTitle>Error</DrawerTitle>
            </DrawerHeader>
            <p className="mt-4">Could not load execution history: {error?.message}</p>
          </Box>
        ) : null}

        {task && !isLoading && !isError ? (
          <>
            <DrawerHeader>
              <Box className="flex items-center justify-between">
                <Box>
                  <DrawerTitle>{taskName || 'Task Execution History'}</DrawerTitle>
                  <DrawerDescription>Execution history and details</DrawerDescription>
                </Box>
              </Box>
            </DrawerHeader>

            <DrawerBody className="py-0! -mx-6 h-full overflow-y-auto bg-gray-50/30 dark:bg-transparent">
              <Box className="p-6">
                {!task.executions || task.executions.length === 0 ? (
                  <Box className="py-8 text-center text-muted-foreground">
                    <p>No execution history yet</p>
                  </Box>
                ) : (
                  <Box className="space-y-6">
                    <TaskStatsSummary stats={task.stats} />
                    <TaskExecutionList executions={task.executions} />
                  </Box>
                )}
              </Box>
            </DrawerBody>
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
