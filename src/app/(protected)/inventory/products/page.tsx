import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { constructMetadata } from '@/lib/utils';
import { getProducts } from '@/actions/inventory/products';
import { ProductsView } from '@/features/inventory/products/components/product-view';

export const metadata = constructMetadata({
  title: 'Products – lfm dashboard',
  description: 'Manage your product catalog and inventory.',
});

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParamsResolved = await searchParams;
  const result = await getProducts(searchParamsResolved);

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <ProductsView initialData={result.data} searchParams={searchParamsResolved} />
    </Shell>
  );
}
