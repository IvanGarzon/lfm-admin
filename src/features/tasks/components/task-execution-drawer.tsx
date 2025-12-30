'use client';

import { useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { X, CheckCircle2, XCircle, Loader2, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useTaskExecutions } from '../hooks/use-tasks';
import type { ExecutionStatus } from '@/prisma/client';

// Helper functions to safely handle unknown types from JSON fields
const safeStringify: (value: unknown) => string = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

const safeDate = (value: unknown): Date => {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return new Date();
};

export function TaskExecutionDrawer({
  taskId,
  taskName,
  open,
  onClose,
}: {
  taskId?: string;
  taskName?: string;
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Support both controlled (via open prop) and URL-based opening
  const isPathnameBased = taskId && pathname?.includes(`/tasks/${taskId}/executions`);
  const isOpen = isPathnameBased || (open ?? false);

  const handleOpenChange = useCallback(
    (openState: boolean) => {
      if (!openState) {
        if (isPathnameBased) {
          router.back();
        } else if (onClose) {
          onClose();
        }
      }
    },
    [isPathnameBased, router, onClose],
  );

  const { data, isLoading } = useQuery(useTaskExecutions(taskId || '', { limit: 20 }));

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'RUNNING':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'TIMEOUT':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <Box className="flex items-center justify-between">
            <Box>
              <DrawerTitle>{taskName || 'Task Execution History'}</DrawerTitle>
              <DrawerDescription>Execution history and details</DrawerDescription>
            </Box>
            <Button variant="ghost" size="icon" onClick={() => handleOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </Box>
        </DrawerHeader>

        <DrawerBody>
          {isLoading ? (
            <Box className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </Box>
          ) : !data?.executions || data.executions.length === 0 ? (
            <Box className="py-8 text-center text-muted-foreground">
              <p>No execution history yet</p>
            </Box>
          ) : (
            <Box className="space-y-4">
              {/* Stats Summary */}
              <Box className="grid grid-cols-4 gap-4">
                <Box className="rounded-lg border p-3">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{data.stats.total}</p>
                </Box>
                <Box className="rounded-lg border p-3">
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{data.stats.completed}</p>
                </Box>
                <Box className="rounded-lg border p-3">
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{data.stats.failed}</p>
                </Box>
                <Box className="rounded-lg border p-3">
                  <p className="text-sm text-muted-foreground">Avg Duration</p>
                  <p className="text-2xl font-bold">
                    {data.stats.avgDuration
                      ? `${(data.stats.avgDuration / 1000).toFixed(1)}s`
                      : '-'}
                  </p>
                </Box>
              </Box>

              {/* Execution History Accordion */}
              <Box className="mt-6">
                <h3 className="font-semibold mb-3">Recent Executions</h3>
                <Accordion type="single" collapsible className="w-full">
                  {data.executions.map((execution) => (
                    <AccordionItem key={execution.id} value={execution.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <Box className="flex items-center justify-between w-full pr-4">
                          <Box className="flex items-center gap-3">
                            {getStatusIcon(execution.status)}
                            <Box className="text-left">
                              <p className="font-medium text-sm">
                                {format(new Date(execution.startedAt), 'MMM dd, yyyy HH:mm:ss')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {execution.triggeredBy} •{' '}
                                {execution.duration
                                  ? `${(execution.duration / 1000).toFixed(2)}s`
                                  : 'In progress'}
                              </p>
                            </Box>
                          </Box>
                          <Badge
                            variant={execution.status === 'COMPLETED' ? 'default' : 'destructive'}
                          >
                            {execution.status}
                          </Badge>
                        </Box>
                      </AccordionTrigger>
                      <AccordionContent>
                        <Box className="space-y-3 pt-2 pl-7">
                          {/* Execution Details */}
                          <Box className="grid grid-cols-2 gap-2 text-sm">
                            <Box>
                              <span className="text-muted-foreground">Started:</span>
                              <p className="font-medium">
                                {format(safeDate(execution.startedAt), 'PPpp')}
                              </p>
                            </Box>
                            {execution.completedAt ? (
                              <Box>
                                <span className="text-muted-foreground">Completed:</span>
                                <p className="font-medium">
                                  {format(safeDate(execution.completedAt), 'PPpp')}
                                </p>
                              </Box>
                            ) : null}
                            <Box>
                              <span className="text-muted-foreground">Triggered By:</span>
                              <p className="font-medium">{safeString(execution.triggeredBy)}</p>
                            </Box>
                            {execution.retryCount > 0 ? (
                              <Box>
                                <span className="text-muted-foreground">Retries:</span>
                                <p className="font-medium">{execution.retryCount}</p>
                              </Box>
                            ) : null}
                          </Box>

                          {/* Result */}
                          {!!safeStringify(execution.result) ? (
                            <Box>
                              <p className="text-sm text-muted-foreground mb-1">Result:</p>
                              <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                                {safeStringify(execution.result)}
                              </pre>
                            </Box>
                          ) : null}

                          {/* Error */}
                          {execution.error ? (
                            <Box>
                              <p className="text-sm text-red-600 font-medium mb-1">Error:</p>
                              <Box className="text-xs bg-red-50 p-3 rounded-md">
                                <p className="text-red-800 font-mono">
                                  {safeString(execution.error)}
                                </p>
                                {!!execution.stackTrace && (
                                  <details className="mt-2">
                                    <summary className="cursor-pointer text-red-600 hover:text-red-700">
                                      Stack Trace
                                    </summary>
                                    <pre className="mt-2 text-red-700 overflow-x-auto">
                                      {safeString(execution.stackTrace)}
                                    </pre>
                                  </details>
                                )}
                              </Box>
                            </Box>
                          ) : null}

                          {/* Steps */}
                          {Array.isArray(execution.steps) && execution.steps.length > 0 ? (
                            <Box>
                              <p className="text-sm text-muted-foreground mb-1">Steps:</p>
                              <div className="space-y-1">
                                {Array.from(execution.steps).map((step: unknown, idx: number) => (
                                  <div key={idx} className="text-xs bg-muted p-2 rounded">
                                    {typeof step === 'string' ? step : safeStringify(step)}
                                  </div>
                                ))}
                              </div>
                            </Box>
                          ) : null}
                        </Box>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Box>
            </Box>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
