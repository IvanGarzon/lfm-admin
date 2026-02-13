import { SearchParams } from 'nuqs/server';
import { constructMetadata } from '@/lib/utils';
import { Shell } from '@/components/shared/shell';
import { OrganizationsList } from '@/features/crm/organizations/components/organizations-list';
import { getOrganizations } from '@/actions/crm/organizations/queries';

export const metadata = constructMetadata({
  title: 'Organizations – lfm dashboard',
  description: 'Manage your organizations.',
});

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParamsResolved = await searchParams;
  const result = await getOrganizations(searchParamsResolved);

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <OrganizationsList initialData={result.data} searchParams={searchParamsResolved} />
    </Shell>
  );
}
