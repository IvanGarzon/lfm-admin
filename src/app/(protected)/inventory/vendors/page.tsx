import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { constructMetadata } from '@/lib/utils';
import { getVendors } from '@/actions/inventory/vendors/queries';
import { VendorsView } from '@/features/inventory/vendors/components/vendor-view';

export const metadata = constructMetadata({
  title: 'Vendors – lfm dashboard',
  description: 'Manage your suppliers and vendors.',
});

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParamsResolved = await searchParams;
  const result = await getVendors(searchParamsResolved);

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <VendorsView initialData={result.data} searchParams={searchParamsResolved} />
    </Shell>
  );
}
