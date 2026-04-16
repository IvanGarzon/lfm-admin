import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { constructMetadata } from '@/lib/utils';
import { getPriceListItems } from '@/actions/inventory/price-list/queries';
import { PriceListView } from '@/features/inventory/price-list/components/price-list-view';

export const metadata = constructMetadata({
  title: 'Price List – lfm dashboard',
  description: 'Manage your pricing catalog for florals, sundries, and supplies.',
});

export default async function PriceListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParamsResolved = await searchParams;
  const result = await getPriceListItems(searchParamsResolved);

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <PriceListView initialData={result.data} searchParams={searchParamsResolved} />
    </Shell>
  );
}
