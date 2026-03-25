import { format } from 'date-fns';
import { Box } from '@/components/ui/box';

interface TaskExecutionDetailsProps {
  startedAt: Date | string;
  completedAt?: Date | string | null;
  triggeredBy: string;
  retryCount: number;
}

const safeDate = (value: unknown): Date => {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  }

  return new Date();
};

const safeString = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
};

export function TaskExecutionDetails({
  startedAt,
  completedAt,
  triggeredBy,
  retryCount,
}: TaskExecutionDetailsProps) {
  return (
    <Box className="grid grid-cols-2 gap-2 text-sm">
      <Box>
        <span className="text-muted-foreground">Started:</span>
        <p className="font-medium">{format(safeDate(startedAt), 'PPpp')}</p>
      </Box>
      {completedAt ? (
        <Box>
          <span className="text-muted-foreground">Completed:</span>
          <p className="font-medium">{format(safeDate(completedAt), 'PPpp')}</p>
        </Box>
      ) : null}
      <Box>
        <span className="text-muted-foreground">Triggered By:</span>
        <p className="font-medium">{safeString(triggeredBy)}</p>
      </Box>
      {retryCount > 0 ? (
        <Box>
          <span className="text-muted-foreground">Retries:</span>
          <p className="font-medium">{retryCount}</p>
        </Box>
      ) : null}
    </Box>
  );
}
