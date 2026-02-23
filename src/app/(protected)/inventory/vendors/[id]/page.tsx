import { SearchParams } from 'nuqs/server';
import dynamic from 'next/dynamic';
import { Shell } from '@/components/shared/shell';
import { getVendors } from '@/actions/inventory/vendors';
import { VendorsView } from '@/features/inventory/vendors/components/vendor-view';

const VendorDrawer = dynamic(
  () =>
    import('@/features/inventory/vendors/components/vendor-drawer').then((mod) => mod.VendorDrawer),
  {
    loading: () => null,
  },
);

export default async function VendorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const searchParamsResolved = await searchParams;
  const result = await getVendors(searchParamsResolved);

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <VendorsView initialData={result.data} searchParams={searchParamsResolved} />
      {id ? <VendorDrawer id={id} /> : null}
    </Shell>
  );
}
