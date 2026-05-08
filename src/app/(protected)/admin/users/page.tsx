import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { Shell } from '@/components/shared/shell';
import { UsersList } from '@/features/admin/users/components/users-list';
import { getAdminAllUsers } from '@/actions/admin/users/queries';
import { getQueryClient } from '@/lib/query-client';
import { USER_KEYS } from '@/features/admin/users/hooks/use-user-queries';

export default async function AdminUsersPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: USER_KEYS.lists(),
    queryFn: async () => {
      const result = await getAdminAllUsers();
      if (!result.success) throw new Error(result.error);
      return result.data;
    }
  });

  return (
    <Shell scrollable>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <UsersList />
      </HydrationBoundary>
    </Shell>
  );
}
