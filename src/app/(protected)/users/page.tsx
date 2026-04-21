import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { UsersList } from '@/features/users/components/users-list';
import { getTenantUsers } from '@/actions/users/queries';
import { constructMetadata } from '@/lib/utils';

export const metadata = constructMetadata({
  title: 'Users – lfm dashboard',
  description: 'Manage users and their access.',
});

export default async function UsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const searchParamsResolved = await searchParams;
  const result = await getTenantUsers(searchParamsResolved);

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <UsersList initialData={result.data} searchParams={searchParamsResolved} />
    </Shell>
  );
}
