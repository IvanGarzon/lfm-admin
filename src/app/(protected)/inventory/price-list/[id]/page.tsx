import { SearchParams } from 'nuqs/server';
import dynamic from 'next/dynamic';
import { Shell } from '@/components/shared/shell';
import { getPriceListItems } from '@/actions/inventory/price-list/queries';
import { PriceListView } from '@/features/inventory/price-list/components/price-list-view';

const PriceListDrawer = dynamic(
  () =>
    import('@/features/inventory/price-list/components/price-list-drawer').then(
      (mod) => mod.PriceListDrawer,
    ),
  {
    loading: () => null,
  },
);

export default async function PriceListItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const searchParamsResolved = await searchParams;
  const result = await getPriceListItems(searchParamsResolved);

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <PriceListView initialData={result.data} searchParams={searchParamsResolved} />
      {id ? <PriceListDrawer id={id} open={true} /> : null}
    </Shell>
  );
}
