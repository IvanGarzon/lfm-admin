import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { UsersList } from '@/features/users/components/users-list';
import { getTenantUsers } from '@/actions/users/queries';
import { getQueryClient } from '@/lib/query-client';
import { USER_KEYS } from '@/features/users/constants/query-keys';
import { constructMetadata } from '@/lib/utils';

export const metadata = constructMetadata({
  title: 'Users – lfm dashboard',
  description: 'Manage users and their access.',
});

export default async function UsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const searchParamsResolved = await searchParams;
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: USER_KEYS.list(JSON.stringify(searchParamsResolved)),
    queryFn: async () => {
      const result = await getTenantUsers(searchParamsResolved);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });

  return (
    <Shell scrollable>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <UsersList searchParams={searchParamsResolved} />
      </HydrationBoundary>
    </Shell>
  );
}
