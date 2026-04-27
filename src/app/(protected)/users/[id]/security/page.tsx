import dynamic from 'next/dynamic';
import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { UsersList } from '@/features/users/components/users-list';
import { getTenantUsers } from '@/actions/users/queries';

const UserDrawer = dynamic(
  () => import('@/features/users/components/user-drawer').then((mod) => mod.UserDrawer),
  { loading: () => null },
);

export default async function UserSecurityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const searchParamsResolved = await searchParams;
  const result = await getTenantUsers(searchParamsResolved);

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <UsersList initialData={result.data} searchParams={searchParamsResolved} />
      <UserDrawer id={id} open={true} tab="security" />
    </Shell>
  );
}
