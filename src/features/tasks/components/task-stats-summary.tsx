import { Box } from '@/components/ui/box';

interface TaskStatsSummaryProps {
  stats: {
    total: number;
    completed: number;
    failed: number;
    avgDuration: number | null;
  };
}

export function TaskStatsSummary({ stats }: TaskStatsSummaryProps) {
  return (
    <Box className="grid grid-cols-4 gap-4">
      <Box className="rounded-lg border p-3 bg-background">
        <p className="text-sm text-muted-foreground">Total</p>
        <p className="text-2xl font-bold">{stats.total}</p>
      </Box>
      <Box className="rounded-lg border p-3 bg-background">
        <p className="text-sm text-muted-foreground">Completed</p>
        <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
      </Box>
      <Box className="rounded-lg border p-3 bg-background">
        <p className="text-sm text-muted-foreground">Failed</p>
        <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
      </Box>
      <Box className="rounded-lg border p-3 bg-background">
        <p className="text-sm text-muted-foreground">Avg Duration</p>
        <p className="text-2xl font-bold">
          {stats.avgDuration ? `${(stats.avgDuration / 1000).toFixed(1)}s` : '-'}
        </p>
      </Box>
    </Box>
  );
}
