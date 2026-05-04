import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { SearchParams } from 'nuqs/server';
import { constructMetadata } from '@/lib/utils';
import { Shell } from '@/components/shared/shell';
import { OrganizationsList } from '@/features/crm/organizations/components/organizations-list';
import { getOrganizations } from '@/actions/crm/organizations/queries';
import { getQueryClient } from '@/lib/query-client';
import { ORGANIZATION_KEYS } from '@/features/crm/organizations/constants/query-keys';
import { searchParamsCache } from '@/filters/organizations/organizations-filters';

export const metadata = constructMetadata({
  title: 'Organizations – lfm dashboard',
  description: 'Manage your organizations.'
});

export default async function OrganizationsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParamsResolved = await searchParams;
  const filters = searchParamsCache.parse(searchParamsResolved);
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: ORGANIZATION_KEYS.list(filters),
    queryFn: async () => {
      const result = await getOrganizations(filters);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    }
  });

  return (
    <Shell scrollable>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <OrganizationsList searchParams={searchParamsResolved} />
      </HydrationBoundary>
    </Shell>
  );
}
