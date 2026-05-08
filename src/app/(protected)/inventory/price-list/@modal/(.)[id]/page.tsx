'use client';

import { use } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const PriceListDrawer = dynamic(
  () =>
    import('@/features/inventory/price-list/components/price-list-drawer').then(
      (mod) => mod.PriceListDrawer
    ),
  {
    ssr: false,
    loading: () => null
  }
);

export default function PriceListModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const pathname = usePathname();
  const shouldRender = pathname?.includes(`/price-list/${id}`) ?? false;

  if (!shouldRender) {
    return null;
  }

  return <PriceListDrawer id={id} open={true} />;
}
