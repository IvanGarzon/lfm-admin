import { TasksList } from '@/features/tasks/components/tasks-list';
import { Shell } from '@/components/shared/shell';
import { getTasks } from '@/actions/tasks';

export default async function TasksPage() {
  const result = await getTasks();

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <TasksList data={result.data} />
    </Shell>
  );
}
