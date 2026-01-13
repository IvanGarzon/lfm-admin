'use client';

import { use } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const TransactionDrawer = dynamic(
  () =>
    import('@/features/finances/transactions/components/transaction-drawer').then(
      (mod) => mod.TransactionDrawer,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

export default function TransactionModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const pathname = usePathname();
  const shouldRender = pathname?.includes(`/transactions/${id}`) ?? false;

  if (!shouldRender) {
    return null;
  }

  return <TransactionDrawer key={id} id={id} onClose={() => Promise.resolve()} />;
}
