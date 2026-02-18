import { SearchParams } from 'nuqs/server';
import dynamic from 'next/dynamic';
import { Shell } from '@/components/shared/shell';
import { getProducts } from '@/actions/inventory/products';
import { ProductsView } from '@/features/inventory/products/components/product-view';

const ProductDrawer = dynamic(
  () =>
    import('@/features/inventory/products/components/product-drawer').then(
      (mod) => mod.ProductDrawer,
    ),
  {
    loading: () => null,
  },
);

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const searchParamsResolved = await searchParams;
  const result = await getProducts(searchParamsResolved);

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <ProductsView initialData={result.data} searchParams={searchParamsResolved} />
      {id ? <ProductDrawer id={id} open={true} /> : null}
    </Shell>
  );
}
