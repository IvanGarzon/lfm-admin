import { SearchParams } from 'nuqs/server';
import { TasksList } from '@/features/tasks/components/tasks-list';
import { Shell } from '@/components/shared/shell';
import { getTasks } from '@/actions/tasks/queries';

export default async function TasksPage({ searchParams }: { searchParams: SearchParams }) {
  const result = await getTasks();

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <TasksList initialData={result.data} searchParams={searchParams} />
    </Shell>
  );
}
