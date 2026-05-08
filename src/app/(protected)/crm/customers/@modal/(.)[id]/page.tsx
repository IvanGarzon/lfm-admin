// import { CustomerDrawer } from '@/features/crm/customers/components/customer-drawer';

'use client';

import { use } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const CustomerDrawer = dynamic(
  () =>
    import('@/features/crm/customers/components/customer-drawer').then((mod) => mod.CustomerDrawer),
  {
    ssr: false,
    loading: () => null
  }
);

export default async function CustomerModalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const pathname = usePathname();
  const shouldRender = pathname?.includes(`/customers/${id}`) ?? false;

  if (!shouldRender) {
    return null;
  }

  return <CustomerDrawer id={id} open={true} />;
}
