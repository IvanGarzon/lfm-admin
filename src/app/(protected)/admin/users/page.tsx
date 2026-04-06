import { Shell } from '@/components/shared/shell';
import { UsersList } from '@/features/admin/users/components/users-list';
import { getAdminAllUsers } from '@/actions/admin/users/queries';

export default async function AdminUsersPage() {
  const result = await getAdminAllUsers();

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <UsersList initialData={result.data} />
    </Shell>
  );
}
