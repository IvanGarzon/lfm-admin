'use client';

import { use } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const ProductDrawer = dynamic(
  () =>
    import('@/features/inventory/products/components/product-drawer').then(
      (mod) => mod.ProductDrawer
    ),
  {
    ssr: false,
    loading: () => null
  }
);

export default function ProductModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const pathname = usePathname();
  const shouldRender = pathname?.includes(`/products/${id}`) ?? false;

  if (!shouldRender) {
    return null;
  }

  return <ProductDrawer id={id} open={true} />;
}
