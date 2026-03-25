import { Box } from '@/components/ui/box';

interface TaskExecutionErrorProps {
  error: string | null;
  stackTrace?: string | null;
}

const safeString = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
};

export function TaskExecutionError({ error, stackTrace }: TaskExecutionErrorProps) {
  if (!error) {
    return null;
  }

  return (
    <Box>
      <p className="text-sm text-red-600 font-medium mb-1">Error:</p>
      <Box className="text-xs bg-red-50 dark:bg-red-950/30 p-3 rounded-md">
        <p className="text-red-800 dark:text-red-300 font-mono">{safeString(error)}</p>
        {stackTrace ? (
          <details className="mt-2">
            <summary className="cursor-pointer text-red-600 hover:text-red-700">
              Stack Trace
            </summary>
            <pre className="mt-2 text-red-700 dark:text-red-400 overflow-x-auto">
              {safeString(stackTrace)}
            </pre>
          </details>
        ) : null}
      </Box>
    </Box>
  );
}
