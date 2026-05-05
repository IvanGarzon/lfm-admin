import dynamic from 'next/dynamic';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { UsersList } from '@/features/users/components/users-list';
import { getTenantUsers, getTenantUserById } from '@/actions/users/queries';
import { getQueryClient } from '@/lib/query-client';
import { USER_KEYS } from '@/features/users/constants/query-keys';
import { searchParamsCache } from '@/filters/users/users-filters';

const UserDrawer = dynamic(
  () => import('@/features/users/components/user-drawer').then((mod) => mod.UserDrawer),
  { loading: () => null }
);

export default async function UserSecurityPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const searchParamsResolved = await searchParams;
  const filters = searchParamsCache.parse(searchParamsResolved);
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: USER_KEYS.detail(id),
      queryFn: async () => {
        const result = await getTenantUserById(id);
        if (!result.success) {
          throw new Error(result.error);
        }

        return result.data;
      }
    }),
    queryClient.prefetchQuery({
      queryKey: USER_KEYS.list(filters),
      queryFn: async () => {
        const result = await getTenantUsers(filters);
        if (!result.success) {
          throw new Error(result.error);
        }

        return result.data;
      }
    })
  ]);

  return (
    <Shell scrollable>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <UsersList />
        {id ? <UserDrawer id={id} open={true} tab='security' /> : null}
      </HydrationBoundary>
    </Shell>
  );
}
