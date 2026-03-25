import { Box } from '@/components/ui/box';

interface TaskExecutionResultProps {
  result: unknown;
}

const safeStringify: (value: unknown) => string = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export function TaskExecutionResult({ result }: TaskExecutionResultProps) {
  const stringifiedResult = safeStringify(result);

  if (!stringifiedResult) {
    return null;
  }

  return (
    <Box>
      <p className="text-sm text-muted-foreground mb-1">Result:</p>
      <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">{stringifiedResult}</pre>
    </Box>
  );
}
