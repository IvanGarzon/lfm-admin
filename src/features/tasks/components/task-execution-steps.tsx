import { Box } from '@/components/ui/box';

interface TaskExecutionStepsProps {
  steps: unknown;
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

export function TaskExecutionSteps({ steps }: TaskExecutionStepsProps) {
  if (!Array.isArray(steps) || steps.length === 0) {
    return null;
  }

  return (
    <Box>
      <p className="text-sm text-muted-foreground mb-1">Steps:</p>
      <div className="space-y-1">
        {Array.from(steps).map((step: unknown, idx: number) => (
          <div key={idx} className="text-xs bg-muted p-2 rounded">
            {typeof step === 'string' ? step : safeStringify(step)}
          </div>
        ))}
      </div>
    </Box>
  );
}
