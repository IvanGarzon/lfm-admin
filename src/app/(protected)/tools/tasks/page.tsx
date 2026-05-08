import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { TasksList } from '@/features/tasks/components/tasks-list';
import { Shell } from '@/components/shared/shell';
import { getTasks } from '@/actions/tasks/queries';
import { getQueryClient } from '@/lib/query-client';
import { TASK_KEYS } from '@/features/tasks/hooks/use-tasks';

export default async function TasksPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: TASK_KEYS.list(undefined),
    queryFn: async () => {
      const result = await getTasks(undefined);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    }
  });

  return (
    <Shell scrollable>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <TasksList />
      </HydrationBoundary>
    </Shell>
  );
}
