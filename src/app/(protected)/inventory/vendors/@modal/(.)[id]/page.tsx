'use client';

import { use } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const VendorDrawer = dynamic(
  () =>
    import('@/features/inventory/vendors/components/vendor-drawer').then((mod) => mod.VendorDrawer),
  {
    ssr: false,
    loading: () => null
  }
);

export default function VendorModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const pathname = usePathname();
  const shouldRender = pathname?.includes(`/vendors/${id}`) ?? false;

  if (!shouldRender) {
    return null;
  }

  return <VendorDrawer id={id} />;
}
