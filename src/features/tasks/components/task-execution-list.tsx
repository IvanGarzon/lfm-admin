import { format } from 'date-fns';
import { CheckCircle2, XCircle, Loader2, Clock, AlertCircle } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { TaskExecutionStatusBadge } from './task-execution-status-badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { TaskExecutionDetails } from './task-execution-details';
import { TaskExecutionResult } from './task-execution-result';
import { TaskExecutionError } from './task-execution-error';
import { TaskExecutionSteps } from './task-execution-steps';
import type { ExecutionStatus, TaskExecution } from '@/prisma/client';

interface TaskExecutionListProps {
  executions: TaskExecution[];
}

const getStatusIcon = (status: ExecutionStatus) => {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />;
    case 'FAILED':
      return <XCircle className="h-4 w-4 text-red-600" aria-hidden="true" />;
    case 'RUNNING':
      return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" aria-hidden="true" />;
    case 'TIMEOUT':
      return <Clock className="h-4 w-4 text-orange-600" aria-hidden="true" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-600" aria-hidden="true" />;
  }
};

export function TaskExecutionList({ executions }: TaskExecutionListProps) {
  if (executions.length === 0) {
    return (
      <Box className="py-8 text-center text-muted-foreground">
        <p>No execution history yet</p>
      </Box>
    );
  }

  return (
    <Box>
      <h3 className="font-semibold mb-3">Recent Executions</h3>
      <Accordion type="single" collapsible className="w-full">
        {executions.map((execution) => (
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
                <TaskExecutionStatusBadge status={execution.status} />
              </Box>
            </AccordionTrigger>
            <AccordionContent>
              <Box className="space-y-3 pt-2 pl-7">
                <TaskExecutionDetails
                  startedAt={execution.startedAt}
                  completedAt={execution.completedAt}
                  triggeredBy={execution.triggeredBy}
                  retryCount={execution.retryCount}
                />

                <TaskExecutionResult result={execution.result} />

                <TaskExecutionError error={execution.error} stackTrace={execution.stackTrace} />

                <TaskExecutionSteps steps={execution.steps} />
              </Box>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Box>
  );
}
